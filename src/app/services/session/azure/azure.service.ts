import {Injectable} from '@angular/core';
import {WorkspaceService} from '../../workspace.service';
import {AzureSession} from '../../../models/azure-session';
import {FileService} from '../../file.service';
import {environment} from '../../../../environments/environment';
import {AppService} from '../../app.service';
import {ExecuteService} from '../../execute.service';
import {SessionService} from '../../session.service';
import {LeappExecuteError} from '../../../errors/leapp-execute-error';
import {LeappParseError} from '../../../errors/leapp-parse-error';

export interface AzureSessionRequest {
  sessionName: string;
  region: string;
  subscriptionId: string;
  tenantId: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class AzureService extends SessionService {

  constructor(
    protected workspaceService: WorkspaceService,
    private fileService: FileService,
    private appService: AppService,
    private executeService: ExecuteService
  ) {
    super(workspaceService);
  }

  create(sessionRequest: AzureSessionRequest): void {
    const session = new AzureSession(sessionRequest.sessionName, sessionRequest.region, sessionRequest.subscriptionId, sessionRequest.tenantId);
    this.workspaceService.addSession(session);
  }

  async start(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);

    const session = this.get(sessionId);

    // Try parse accessToken.json
    let accessTokensFile = this.parseAccessTokens();

    // extract accessToken corresponding to the specific tenant (if not present, require az login)
    let accessTokenExpirationTime;
    if(accessTokensFile) {
      accessTokenExpirationTime = this.extractAccessTokenExpirationTime(accessTokensFile, (session as AzureSession).tenantId, (session as AzureSession).subscriptionId);
    }

    if (!accessTokenExpirationTime) {
      try {
        await this.executeService.execute(`az login --tenant ${(session as AzureSession).tenantId} 2>&1`);
        accessTokensFile = this.parseAccessTokens();
        accessTokenExpirationTime = this.extractAccessTokenExpirationTime(accessTokensFile, (session as AzureSession).tenantId, (session as AzureSession).subscriptionId);
      } catch(err) {
        this.sessionDeactivated(sessionId);
        throw new LeappExecuteError(this, err.message);
      }
    }

    // if access token is expired OR doesn't exist (FOR VERSION >= 2.30.0)
    if (!accessTokenExpirationTime || (new Date(accessTokenExpirationTime).getTime() < Date.now())) {
      try {
        await this.executeService.execute(`az account get-access-token --subscription ${(session as AzureSession).subscriptionId}`);
      } catch(err) {
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
      if(accessTokensFile) {
        this.deleteRefreshToken();
      }

    } catch(err) {
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
    } catch(err) {
      throw new LeappExecuteError(this, err.message);
    } finally {
      this.sessionDeactivated(sessionId);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      await this.stop(sessionId);
      this.workspaceService.removeSession(sessionId);
    } catch(error) {
      throw new LeappParseError(this, error.message);
    }
  }

  private async extractAccessTokenExpirationTime(accessTokens: AzureSessionToken[], tenantId: string, subscriptionId: string): Promise<string> {
    if(accessTokens) {
      /////////////////////////////////////////////////////////////////////////////////////////////////////
      //!!! FOR AZURE CLI PRIOR TO 2.30.0 https://docs.microsoft.com/en-us/cli/azure/msal-based-azure-cli//
      /////////////////////////////////////////////////////////////////////////////////////////////////////
      const correctToken = accessTokens.find(accessToken => accessToken._authority.split('/')[1] === tenantId);
      return correctToken ? correctToken.expiresOn : undefined;
    } else {
      ///////////////////////////////////////////////////////////////////////////////////////////////
      //!!! FOR AZURE CLI >= 2.30.0 https://docs.microsoft.com/en-us/cli/azure/msal-based-azure-cli//
      ///////////////////////////////////////////////////////////////////////////////////////////////
      try {
        const result = await this.executeService.execute(`az account get-access-token --subscription ${subscriptionId}`);
        const correctToken = JSON.parse(result);
        return correctToken ? correctToken.expiresOn : undefined;
      } catch(err) {
        return undefined;
      }
    }
  }

  private deleteRefreshToken(): void {
    const accessTokensString = this.fileService.readFileSync(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`);
    let azureSessionTokens = JSON.parse(accessTokensString) as AzureSessionToken[];
    azureSessionTokens = azureSessionTokens.map(azureSessionToken => {
      delete azureSessionToken.refreshToken;
      return azureSessionToken;
    });
    this.fileService.writeFileSync(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`, JSON.stringify(azureSessionTokens));
  }

  private parseAccessTokens(): AzureSessionToken[] {
    if (!this.accessTokenFileExists()) {
      return undefined;
    }

    const accessTokensString = this.fileService.readFileSync(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`);
    return JSON.parse(accessTokensString) as AzureSessionToken[];
  }

  private accessTokenFileExists(): boolean {
    return this.fileService.exists(`${this.appService.getOS().homedir()}/${environment.azureAccessTokens}`);
  }
}
