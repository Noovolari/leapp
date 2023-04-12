import { SessionFactory } from "./session-factory";
import { SessionType } from "../models/session-type";
import { NamedProfilesService } from "./named-profiles-service";
import { SessionManagementService } from "./session-management-service";
import { AwsSsoIntegrationService } from "./integration/aws-sso-integration-service";
import { AwsIamUserSession } from "../models/aws/aws-iam-user-session";
import { AwsSessionService } from "./session/aws/aws-session-service";
import { AwsIamRoleChainedService } from "./session/aws/aws-iam-role-chained-service";
import { AwsIamUserService } from "./session/aws/aws-iam-user-service";
import { LoggedException, LogLevel } from "./log-service";
import { AwsIamRoleFederatedService } from "./session/aws/aws-iam-role-federated-service";
import { IdpUrlsService } from "./idp-urls-service";
import { AzureIntegrationService } from "./integration/azure-integration-service";
import { LocalSecretDto } from "leapp-team-core/encryptable-dto/local-secret-dto";
import { AwsIamUserLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-user-local-session-dto";
import { User } from "leapp-team-core/user/user";
import { AwsIamFederatedLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-federated-local-session-dto";
import { AwsSsoLocalIntegrationDto } from "leapp-team-core/encryptable-dto/aws-sso-local-integration-dto";
import { AwsIamRoleChainedLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-role-chained-local-session-dto";
import { AzureLocalIntegrationDto } from "leapp-team-core/encryptable-dto/azure-local-integration-dto";
import { IKeychainService } from "../interfaces/i-keychain-service";
import { constants } from "../models/constants";
import { BehaviorSubject } from "rxjs";
import { INativeService } from "../interfaces/i-native-service";
import { FileService } from "./file-service";
import { WorkspaceService } from "./workspace-service";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { IntegrationFactory } from "./integration-factory";
import { VaultProvider } from "leapp-team-core/vault/vault-provider";
import { EncryptionProvider } from "leapp-team-core/encryption/encryption.provider";
import { UserProvider } from "leapp-team-core/user/user.provider";
import { SecretType } from "leapp-team-core/encryptable-dto/secret-type";
import { HttpClientProvider } from "leapp-team-core/http/http-client.provider";
import { HttpClientInterface } from "leapp-team-core/http/http-client-interface";

const CURRENT_WORKSPACE_KEYCHAIN_KEY = "current-workspace";
const LOCAL_WORKSPACE_NAME = "local";

export class TeamService {
  httpClient: HttpClientInterface;
  private _signedInUserState$: BehaviorSubject<User>;
  private readonly teamSignedInUserKeychainKey = "team-signed-in-user";
  private readonly encryptionProvider: EncryptionProvider;
  private readonly vaultProvider: VaultProvider;
  private readonly userProvider: UserProvider;
  private readonly httpClientProvider: HttpClientProvider;

  constructor(
    private readonly sessionFactory: SessionFactory,
    private readonly namedProfilesService: NamedProfilesService,
    private readonly sessionManagementService: SessionManagementService,
    // TODO: remove these two ones
    private readonly awsSsoIntegrationService: AwsSsoIntegrationService,
    private readonly azureIntegrationService: AzureIntegrationService,
    private readonly idpUrlService: IdpUrlsService,
    private readonly keyChainService: IKeychainService,
    private readonly nativeService: INativeService,
    private readonly fileService: FileService,
    private readonly crypto: Crypto,
    private readonly workspaceService: WorkspaceService,
    private readonly integrationFactory: IntegrationFactory,
    private readonly behaviouralSubjectService?: BehaviouralSubjectService
  ) {
    const apiEndpoint = "http://localhost:3000";
    this._signedInUserState$ = new BehaviorSubject<User>(null);
    this.encryptionProvider = new EncryptionProvider(crypto);
    this.httpClientProvider = new HttpClientProvider();
    this.vaultProvider = new VaultProvider(apiEndpoint, this.httpClientProvider, this.encryptionProvider);
    this.userProvider = new UserProvider(apiEndpoint, this.httpClientProvider, this.encryptionProvider);
  }

  get signedInUserState(): BehaviorSubject<User> {
    return this._signedInUserState$;
  }

  async setCurrentWorkspace(): Promise<void> {
    this.signedInUserState.next(JSON.parse(await this.keyChainService.getSecret(constants.appName, this.teamSignedInUserKeychainKey)));
    const currentWorkspaceName = await this.getCurrentWorkspaceName();
    // Local or null workspace saved in keychain
    if (currentWorkspaceName === null || currentWorkspaceName === LOCAL_WORKSPACE_NAME) {
      await this.setLocalWorkspace();
      // Remote workspace saved in keychain
    } else if (currentWorkspaceName !== LOCAL_WORKSPACE_NAME) {
      try {
        await this.syncSecrets();
      } catch (error) {
        // TODO: NOTIFY USER
        await this.signOut();
      }
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const signedInUser = await this.userProvider.signIn(email, password);
    await this.setSignedInUser(signedInUser);
  }

  async setSignedInUser(signedInUser: User): Promise<void> {
    await this.keyChainService.saveSecret(constants.appName, this.teamSignedInUserKeychainKey, JSON.stringify(signedInUser));
    this.signedInUserState.next(signedInUser);
  }

  async signOut(): Promise<void> {
    this.httpClientProvider.accessToken = "";
    if ((await this.getCurrentWorkspaceName()) !== LOCAL_WORKSPACE_NAME) {
      const signedInUser = this.signedInUserState.getValue();
      this.workspaceService.setWorkspaceFileName(this.getTeamLockFileName(signedInUser.teamId));
      this.workspaceService.reloadWorkspace();
      await this.deleteCurrentWorkspace();
      await this.setLocalWorkspace();
    }
    await this.keyChainService.deleteSecret(constants.appName, this.teamSignedInUserKeychainKey);
    this.signedInUserState.next(null);
  }

  async syncSecrets(): Promise<void> {
    const signedInUser = this.signedInUserState.getValue();
    if (!signedInUser || this.isJwtTokenExpired(signedInUser.accessToken)) {
      // TODO: NOTIFY USER
      await this.signOut();
      return;
    }
    this.httpClientProvider.accessToken = signedInUser.accessToken;
    this.fileService.aesKey = signedInUser.publicRSAKey;
    this.workspaceService.setWorkspaceFileName(this.getTeamLockFileName(signedInUser.teamId));
    this.workspaceService.removeWorkspace();
    // TODO: copy or merge local workspace settings like theme
    this.workspaceService.createWorkspace();
    this.workspaceService.reloadWorkspace();
    const rsaKeys = await this.getRSAKeys(signedInUser);
    const localSecretDtos = await this.vaultProvider.getSecrets(rsaKeys.privateKey);
    const integrationDtos = localSecretDtos.filter(
      (secret) => secret.secretType === SecretType.awsSsoIntegration || secret.secretType === SecretType.azureIntegration
    );
    for (const integrationDto of integrationDtos) {
      await this.syncIntegrationSecret(integrationDto as AwsSsoLocalIntegrationDto);
    }
    const sessionsDtos = localSecretDtos.filter(
      (secret) => secret.secretType !== SecretType.awsSsoIntegration && secret.secretType !== SecretType.azureIntegration
    );
    for (const sessionDto of sessionsDtos) {
      await this.syncSessionsSecret(sessionDto);
    }
    await this.setCurrentWorkspaceName(signedInUser.teamName);
    this.behaviouralSubjectService?.reloadSessionsAndIntegrationsFromRepository();
  }

  async deleteTeamWorkspace() {
    if ((await this.getCurrentWorkspaceName()) !== LOCAL_WORKSPACE_NAME) {
      await this.deleteCurrentWorkspace();
    }
  }

  async switchToLocalWorkspace() {
    await this.deleteTeamWorkspace();
    await this.setLocalWorkspace();
  }

  private async getCurrentWorkspaceName(): Promise<string> {
    return await this.keyChainService.getSecret(constants.appName, CURRENT_WORKSPACE_KEYCHAIN_KEY);
  }

  private async setCurrentWorkspaceName(workspaceName: string): Promise<void> {
    await this.keyChainService.saveSecret(constants.appName, CURRENT_WORKSPACE_KEYCHAIN_KEY, workspaceName);
  }

  private async setLocalWorkspace(): Promise<void> {
    this.fileService.aesKey = this.nativeService.machineId;
    this.workspaceService.setWorkspaceFileName(constants.lockFileDestination);
    this.workspaceService.reloadWorkspace();
    await this.setCurrentWorkspaceName(LOCAL_WORKSPACE_NAME);
    this.behaviouralSubjectService?.reloadSessionsAndIntegrationsFromRepository();
  }

  private async deleteCurrentWorkspace(): Promise<void> {
    const workspace = this.workspaceService.getWorkspace();
    for (const awsSsoIntegration of workspace.awsSsoIntegrations) {
      const concreteIntegrationService = this.integrationFactory.getIntegrationService(awsSsoIntegration.type);
      await concreteIntegrationService.logout(awsSsoIntegration.id);
    }
    for (const azureIntegration of workspace.azureIntegrations) {
      const concreteIntegrationService = this.integrationFactory.getIntegrationService(azureIntegration.type);
      await concreteIntegrationService.logout(azureIntegration.id);
    }
    while (workspace.sessions.length > 0) {
      const concreteSessionService = this.sessionFactory.getSessionService(workspace.sessions[0].type);
      await concreteSessionService.delete(workspace.sessions[0].sessionId);
    }
    this.workspaceService.removeWorkspace();
  }

  private async syncIntegrationSecret(localIntegrationDto: LocalSecretDto): Promise<void> {
    if (localIntegrationDto.secretType === SecretType.awsSsoIntegration) {
      const dto = localIntegrationDto as AwsSsoLocalIntegrationDto;
      const awsSsoIntegration = this.awsSsoIntegrationService.getIntegration(dto.id);
      if (awsSsoIntegration) {
        await this.awsSsoIntegrationService.deleteIntegration(awsSsoIntegration.id);
      }
      await this.awsSsoIntegrationService.createIntegration(
        {
          alias: dto.alias,
          portalUrl: dto.portalUrl,
          region: dto.region,
          browserOpening: dto.browserOpening,
        },
        dto.id
      );
    } else if (localIntegrationDto.secretType === SecretType.azureIntegration) {
      const dto = localIntegrationDto as AzureLocalIntegrationDto;
      const azureIntegration = this.azureIntegrationService.getIntegration(dto.id);
      if (azureIntegration) {
        await this.azureIntegrationService.deleteIntegration(azureIntegration.id);
      }
      await this.azureIntegrationService.createIntegration(
        {
          alias: dto.alias,
          tenantId: dto.tenantId,
          region: dto.region,
        },
        dto.id
      );
    }
  }

  private async syncSessionsSecret(localSecret: LocalSecretDto): Promise<void> {
    if (localSecret.secretType === SecretType.awsIamUserSession) {
      const localSessionDto = localSecret as AwsIamUserLocalSessionDto;
      const sessionService = (await this.sessionFactory.getSessionService(SessionType.awsIamUser)) as AwsIamUserService;
      const profileId = await this.setupAwsSession(sessionService, localSessionDto.sessionId, localSessionDto.profileName);
      await sessionService.create({
        sessionName: localSessionDto.sessionName,
        accessKey: localSessionDto.accessKey,
        secretKey: localSessionDto.secretKey,
        region: localSessionDto.region,
        mfaDevice: localSessionDto.mfaDevice,
        profileId,
        sessionId: localSessionDto.sessionId,
      });
    } else if (localSecret.secretType === SecretType.awsIamRoleChainedSession) {
      const localSessionDto = localSecret as AwsIamRoleChainedLocalSessionDto;
      const sessionService = (await this.sessionFactory.getSessionService(SessionType.awsIamRoleChained)) as AwsIamRoleChainedService;
      const profileId = await this.setupAwsSession(sessionService, localSessionDto.sessionId, localSessionDto.profileName);
      const parentSessionId = await this.getAssumerSessionId(localSessionDto);
      await sessionService.create({
        sessionName: localSessionDto.sessionName,
        region: localSessionDto.region,
        roleArn: localSessionDto.roleArn,
        profileId,
        parentSessionId,
        roleSessionName: localSessionDto.roleSessionName,
        sessionId: localSessionDto.sessionId,
      });
    } else if (localSecret.secretType === SecretType.awsIamRoleFederatedSession) {
      const localSessionDto = localSecret as AwsIamFederatedLocalSessionDto;
      const sessionService = (await this.sessionFactory.getSessionService(SessionType.awsIamRoleFederated)) as AwsIamRoleFederatedService;
      const profileId = await this.setupAwsSession(sessionService, localSessionDto.sessionId, localSessionDto.profileName);
      const idpUrlId = this.idpUrlService.mergeIdpUrl(localSessionDto.samlUrl).id;
      await sessionService.create({
        sessionName: localSessionDto.sessionName,
        region: localSessionDto.region,
        roleArn: localSessionDto.roleArn,
        profileId,
        idpUrl: idpUrlId,
        idpArn: localSessionDto.idpArn,
        sessionId: localSessionDto.sessionId,
      });
    }
  }

  private async getAssumerSessionId(localSessionDto: AwsIamRoleChainedLocalSessionDto): Promise<string> {
    if (localSessionDto.assumerSessionId) {
      return localSessionDto.assumerSessionId;
    } else {
      await this.awsSsoIntegrationService.syncSessions(localSessionDto.assumerIntegrationId);
      const ssoSessions = this.sessionManagementService
        .getAwsSsoRoles()
        .filter(
          (ssoSession) =>
            ssoSession.awsSsoConfigurationId === localSessionDto.assumerIntegrationId &&
            ssoSession.roleArn === `arn:aws:iam::${localSessionDto.assumerAccountId}/${localSessionDto.assumerRoleName}`
        );
      if (ssoSessions.length < 1) {
        throw new LoggedException("Cannot find a proper SSO role from SSO integrations", this, LogLevel.error);
      } else if (ssoSessions.length > 1) {
        throw new LoggedException("Multiple SSO roles found in SSO integrations", this, LogLevel.error);
      }
      return ssoSessions[0].sessionId;
    }
  }

  private async setupAwsSession(sessionService: AwsSessionService, sessionId: string, profileName: string): Promise<string> {
    const localSession = this.sessionManagementService.getSessionById(sessionId) as AwsIamUserSession;
    if (localSession) {
      await sessionService.delete(sessionId);
      return localSession.profileId;
    } else {
      return this.namedProfilesService.mergeProfileName(profileName).id;
    }
  }

  private async getRSAKeys(user: User): Promise<CryptoKeyPair> {
    const rsaKeyJsonPair = { privateKey: user.privateRSAKey, publicKey: user.publicRSAKey };
    return await this.encryptionProvider.importRsaKeys(rsaKeyJsonPair);
  }

  private isJwtTokenExpired(jwtToken: string): boolean {
    const expiry = JSON.parse(atob(jwtToken.split(".")[1])).exp;
    return Math.floor(new Date().getTime() / 1000) >= expiry;
  }

  private getTeamLockFileName(teamName: string): string {
    return `.Leapp/Leapp-${teamName}-lock.json`;
  }
}
