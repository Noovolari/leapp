import { LeappExecuteError } from "../../../errors/leapp-execute-error";
import { LeappParseError } from "../../../errors/leapp-parse-error";
import { ISessionNotifier } from "../../../interfaces/i-session-notifier";
import { AzureSession } from "../../../models/azure-session";
import { Session } from "../../../models/session";
import { ExecuteService } from "../../execute-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { SessionService } from "../session-service";
import { AzureSessionRequest } from "./azure-session-request";

export interface AzureSessionToken {
  tokenType: string;
  expiresIn: number;
  expiresOn: string;
  resource: string;
  accessToken: string;
  refreshToken: string;
  oid: string;
  userId: string;
  isMRRT: boolean;
  _clientId: string;
  _authority: string;
}

export class AzureService extends SessionService {
  constructor(
    iSessionNotifier: ISessionNotifier,
    repository: Repository,
    private fileService: FileService,
    private executeService: ExecuteService,
    private azureAccessTokens: string
  ) {
    super(iSessionNotifier, repository);
  }

  getDependantSessions(_: string): Session[] {
    return [];
  }

  async create(sessionRequest: AzureSessionRequest): Promise<void> {
    const session = new AzureSession(sessionRequest.sessionName, sessionRequest.region, sessionRequest.subscriptionId, sessionRequest.tenantId);
    this.repository.addSession(session);
    this.sessionNotifier?.addSession(session);
  }

  async start(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);

    const session = this.repository.getSessionById(sessionId);

    // Try parse accessToken.json
    let accessTokensFile = this.parseAccessTokens();

    // extract accessToken corresponding to the specific tenant (if not present, require az login)
    let accessTokenExpirationTime;
    accessTokenExpirationTime = await this.extractAccessTokenExpirationTime(
      accessTokensFile,
      (session as AzureSession).tenantId,
      (session as AzureSession).subscriptionId
    );

    if (!accessTokenExpirationTime) {
      try {
        await this.executeService.execute(`az login --tenant ${(session as AzureSession).tenantId} 2>&1`);
        accessTokensFile = this.parseAccessTokens();
        accessTokenExpirationTime = await this.extractAccessTokenExpirationTime(
          accessTokensFile,
          (session as AzureSession).tenantId,
          (session as AzureSession).subscriptionId
        );
      } catch (err) {
        this.sessionDeactivated(sessionId);
        throw new LeappExecuteError(this, err.message);
      }
    }

    // if access token is expired
    if (!accessTokenExpirationTime || new Date(accessTokenExpirationTime).getTime() < Date.now()) {
      try {
        await this.executeService.execute(`az account get-access-token --subscription ${(session as AzureSession).subscriptionId}`);
      } catch (err) {
        this.sessionDeactivated(sessionId);
        throw new LeappExecuteError(this, err.message);
      }
    }

    try {
      // az account set —subscription <xxx> 2>&1
      await this.executeService.execute(`az account set --subscription ${(session as AzureSession).subscriptionId} 2>&1`);
      // az configure —default location <region(location)>
      await this.executeService.execute(`az configure --default location=${(session as AzureSession).region} 2>&1`);
      // delete refresh token from accessTokens
      //(FOR VERSION >= 2.30.0)
      if (this.accessTokenFileExists()) {
        this.deleteRefreshToken();
      }
    } catch (err) {
      this.sessionDeactivated(sessionId);
      throw new LeappExecuteError(this, err.message);
    }

    this.sessionActivate(sessionId);
    return Promise.resolve(undefined);
  }

  async rotate(sessionId: string): Promise<void> {
    return this.start(sessionId);
  }

  async stop(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);
    try {
      await this.executeService.execute(`az account clear 2>&1`);
      await this.executeService.execute(`az configure --defaults location='' 2>&1`);
    } catch (err) {
      throw new LeappExecuteError(this, err.message);
    } finally {
      this.sessionDeactivated(sessionId);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      //TODO: check if session is currently active before trying to stop it?
      await this.stop(sessionId);
      this.repository.deleteSession(sessionId);
      this.sessionNotifier?.deleteSession(sessionId);
    } catch (error) {
      throw new LeappParseError(this, error.message);
    }
  }

  private async extractAccessTokenExpirationTime(accessTokens: AzureSessionToken[], tenantId: string, subscriptionId: string): Promise<string> {
    if (accessTokens) {
      /////////////////////////////////////////////////////////////////////////////////////////////////////
      //!!! FOR AZURE CLI PRIOR TO 2.30.0 https://docs.microsoft.com/en-us/cli/azure/msal-based-azure-cli//
      console.log(accessTokens);
      const correctToken = accessTokens.find(
        (accessToken) => accessToken._authority.split("/")[accessToken._authority.split("/").length - 1] === tenantId
      );
      /////////////////////////////////////////////////////////////////////////////////////////////////////
      return correctToken ? correctToken.expiresOn : undefined;
    } else {
      ///////////////////////////////////////////////////////////////////////////////////////////////
      //!!! FOR AZURE CLI >= 2.30.0 https://docs.microsoft.com/en-us/cli/azure/msal-based-azure-cli//
      ///////////////////////////////////////////////////////////////////////////////////////////////
      try {
        const result = await this.executeService.execute(`az account get-access-token --subscription ${subscriptionId}`);
        const correctToken = JSON.parse(result);
        return correctToken ? correctToken.expiresOn : undefined;
      } catch (err) {
        return undefined;
      }
    }
  }

  private deleteRefreshToken(): void {
    const accessTokensString = this.fileService.readFileSync(`${this.fileService.homeDir()}/${this.azureAccessTokens}`);
    let azureSessionTokens = JSON.parse(accessTokensString) as AzureSessionToken[];
    azureSessionTokens = azureSessionTokens.map((azureSessionToken) => {
      delete azureSessionToken.refreshToken;
      return azureSessionToken;
    });
    this.fileService.writeFileSync(`${this.fileService.homeDir()}/${this.azureAccessTokens}`, JSON.stringify(azureSessionTokens));
  }

  private parseAccessTokens(): AzureSessionToken[] {
    if (!this.accessTokenFileExists()) {
      return undefined;
    }

    const accessTokensString = this.fileService.readFileSync(`${this.fileService.homeDir()}/${this.azureAccessTokens}`);
    return JSON.parse(accessTokensString) as AzureSessionToken[];
  }

  private accessTokenFileExists(): boolean {
    return this.fileService.existsSync(`${this.fileService.homeDir()}/${this.azureAccessTokens}`);
  }
}
