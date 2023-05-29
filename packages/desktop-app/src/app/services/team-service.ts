import { LocalSecretDto } from "../../../leapp-team-core/encryptable-dto/local-secret-dto";
import { AwsIamUserLocalSessionDto } from "../../../leapp-team-core/encryptable-dto/aws-iam-user-local-session-dto";
import { User } from "../../../leapp-team-core/user/user";
import { AwsIamFederatedLocalSessionDto } from "../../../leapp-team-core/encryptable-dto/aws-iam-federated-local-session-dto";
import { AwsSsoLocalIntegrationDto } from "../../../leapp-team-core/encryptable-dto/aws-sso-local-integration-dto";
import { AwsIamRoleChainedLocalSessionDto } from "../../../leapp-team-core/encryptable-dto/aws-iam-role-chained-local-session-dto";
import { AzureLocalIntegrationDto } from "../../../leapp-team-core/encryptable-dto/azure-local-integration-dto";
import { VaultProvider } from "../../../leapp-team-core/vault/vault-provider";
import { EncryptionProvider } from "../../../leapp-team-core/encryption/encryption.provider";
import { UserProvider } from "../../../leapp-team-core/user/user.provider";
import { SecretType } from "../../../leapp-team-core/encryptable-dto/secret-type";
import { HttpClientProvider } from "../../../leapp-team-core/http/http-client.provider";
import { BehaviorSubject } from "rxjs";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { NamedProfilesService } from "@noovolari/leapp-core/services/named-profiles-service";
import { SessionManagementService } from "@noovolari/leapp-core/services/session-management-service";
import { AzureIntegrationService } from "@noovolari/leapp-core/services/integration/azure-integration-service";
import { AwsSsoIntegrationService } from "@noovolari/leapp-core/services/integration/aws-sso-integration-service";
import { IdpUrlsService } from "@noovolari/leapp-core/services/idp-urls-service";
import { IKeychainService } from "@noovolari/leapp-core/interfaces/i-keychain-service";
import { INativeService } from "@noovolari/leapp-core/interfaces/i-native-service";
import { FileService } from "@noovolari/leapp-core/services/file-service";
import { IntegrationFactory } from "@noovolari/leapp-core/services/integration-factory";
import { WorkspaceService } from "@noovolari/leapp-core/services/workspace-service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamUserService } from "@noovolari/leapp-core/services/session/aws/aws-iam-user-service";
import { AwsIamRoleChainedService } from "@noovolari/leapp-core/services/session/aws/aws-iam-role-chained-service";
import { AwsIamRoleFederatedService } from "@noovolari/leapp-core/services/session/aws/aws-iam-role-federated-service";
import { LoggedException, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { AwsIamUserSession } from "@noovolari/leapp-core/models/aws/aws-iam-user-session";

export { User } from "../../../leapp-team-core/user/user";
export { ApiErrorCodes } from "../../../leapp-team-core/errors/api-error-codes";
export { FormErrorCodes } from "../../../leapp-team-core/errors/form-error-codes";

export interface WorkspaceState {
  name: string;
  id: string;
}

export class TeamService {
  private readonly _signedInUserState$: BehaviorSubject<User>;
  private readonly _workspaceState$: BehaviorSubject<WorkspaceState>;
  private readonly _switchingWorkspaceState$: BehaviorSubject<boolean>;
  private readonly teamSignedInUserKeychainKey = "team-signed-in-user";
  private readonly encryptionProvider: EncryptionProvider;
  private readonly vaultProvider: VaultProvider;
  private readonly userProvider: UserProvider;
  private readonly httpClientProvider: HttpClientProvider;

  constructor(
    apiEndpoint: string,
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
    this._signedInUserState$ = new BehaviorSubject<User>(null);
    this._workspaceState$ = new BehaviorSubject<WorkspaceState>({ id: "", name: "" });
    this._switchingWorkspaceState$ = new BehaviorSubject<boolean>(false);
    this.encryptionProvider = new EncryptionProvider(crypto);
    this.httpClientProvider = new HttpClientProvider();
    this.vaultProvider = new VaultProvider(apiEndpoint, this.httpClientProvider, this.encryptionProvider);
    this.userProvider = new UserProvider(apiEndpoint, this.httpClientProvider, this.encryptionProvider);
  }

  get signedInUserState(): BehaviorSubject<User> {
    return this._signedInUserState$;
  }

  get workspaceState(): BehaviorSubject<WorkspaceState> {
    return this._workspaceState$;
  }

  get switchingWorkspaceState(): BehaviorSubject<boolean> {
    return this._switchingWorkspaceState$;
  }

  async getTeamStatus(): Promise<string> {
    const signedInUser = await this.keyChainService.getSecret(constants.appName, this.teamSignedInUserKeychainKey);
    if (signedInUser === null) {
      return "you're not logged in";
    } else {
      const signedInUserValues = JSON.parse(signedInUser) as User;
      return `workspace: ${signedInUserValues.teamName}\nemail: ${signedInUserValues.email}\nstatus: ${
        signedInUserValues.accessToken ? "online" : "offline"
      }`;
    }
  }

  async setCurrentWorkspace(reloadOnly: boolean = false): Promise<void> {
    this.signedInUserState.next(JSON.parse(await this.keyChainService.getSecret(constants.appName, this.teamSignedInUserKeychainKey)));
    const currentWorkspaceName = await this.getKeychainCurrentWorkspace();
    // Local or null workspace saved in keychain
    if (currentWorkspaceName === null || currentWorkspaceName === constants.localWorkspaceKeychainValue) {
      await this.setLocalWorkspace();
      // Remote workspace saved in keychain
    } else if (currentWorkspaceName !== constants.localWorkspaceKeychainValue) {
      try {
        await this.syncSecrets(reloadOnly);
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

  async signOut(lock: boolean = false): Promise<void> {
    this.httpClientProvider.accessToken = "";
    const signedInUser = this.signedInUserState.getValue();
    if (!signedInUser) {
      return;
    }
    if ((await this.getKeychainCurrentWorkspace()) !== constants.localWorkspaceKeychainValue) {
      this.workspaceService.setWorkspaceFileName(this.getTeamLockFileName(signedInUser.teamId));
      this.workspaceService.reloadWorkspace();
      await this.deleteCurrentWorkspace();
      await this.setLocalWorkspace();
    }
    if (lock) {
      signedInUser.symmetricKey = "";
      signedInUser.privateRSAKey = "";
      signedInUser.publicRSAKey = "";
      signedInUser.accessToken = "";
      await this.setSignedInUser(signedInUser);
    } else {
      await this.keyChainService.deleteSecret(constants.appName, this.teamSignedInUserKeychainKey);
      this.signedInUserState.next(null);
    }
  }

  // TODO: in the future, when we'll introduce multiple workspace, this method this will become setRemoteWorkspace(workspaceId)
  async syncSecrets(reloadOnly: boolean = false): Promise<void> {
    const signedInUser = this.signedInUserState.getValue();
    if (!signedInUser || this.isJwtTokenExpired(signedInUser.accessToken)) {
      // TODO: NOTIFY USER
      await this.signOut();
      return;
    }
    await this.setKeychainCurrentWorkspace(signedInUser.teamName);
    await this.refreshWorkspaceState(async (): Promise<void> => {
      if (reloadOnly) {
        this.workspaceService.reloadWorkspace();
        return;
      }
      this.workspaceService.removeWorkspace();
      // TODO: copy or merge local workspace settings like theme
      this.workspaceService.createWorkspace();
      this.workspaceService.reloadWorkspace();
      const rsaKeys = await this.getRSAKeys(signedInUser);
      this.httpClientProvider.accessToken = signedInUser.accessToken;
      const localSecretDtos = await this.vaultProvider.getSecrets(rsaKeys.privateKey);
      const integrationDtos = localSecretDtos.filter(
        (secret) => secret.secretType === SecretType.awsSsoIntegration || secret.secretType === SecretType.azureIntegration
      );
      for (const integrationDto of integrationDtos) {
        await this.syncIntegrationSecret(integrationDto);
      }
      const sessionsDtos = localSecretDtos.filter(
        (secret) => secret.secretType !== SecretType.awsSsoIntegration && secret.secretType !== SecretType.azureIntegration
      );
      for (const sessionDto of sessionsDtos) {
        await this.syncSessionsSecret(sessionDto);
      }
    });
  }

  async deleteTeamWorkspace(): Promise<void> {
    if ((await this.getKeychainCurrentWorkspace()) !== constants.localWorkspaceKeychainValue) {
      await this.deleteCurrentWorkspace();
    }
  }

  async switchToLocalWorkspace(): Promise<void> {
    await this.deleteTeamWorkspace();
    await this.setLocalWorkspace();
  }

  async refreshWorkspaceState(callback?: () => Promise<void>): Promise<void> {
    this.switchingWorkspaceState.next(true);
    try {
      const keychainCurrentWorkspace = await this.getKeychainCurrentWorkspace();
      const signedInUser = JSON.parse(await this.keyChainService.getSecret(constants.appName, this.teamSignedInUserKeychainKey));
      let workspaceState: WorkspaceState;

      if (keychainCurrentWorkspace === constants.localWorkspaceKeychainValue) {
        this.fileService.aesKey = this.nativeService.machineId;
        this.workspaceService.setWorkspaceFileName(constants.lockFileDestination);
        this.workspaceService.reloadWorkspace();
        workspaceState = { name: constants.localWorkspaceName, id: constants.localWorkspaceKeychainValue };
      } else {
        this.fileService.aesKey = signedInUser.publicRSAKey;
        this.workspaceService.setWorkspaceFileName(this.getTeamLockFileName(signedInUser.teamId));
        // If called from CLI, it needs workspaceService.reloadWorkspace() to be invoked.
        await callback?.();
        workspaceState = { name: signedInUser.teamName, id: signedInUser.teamId };
      }

      this.signedInUserState.next(signedInUser);
      this.workspaceState.next(workspaceState);
      this.behaviouralSubjectService?.reloadSessionsAndIntegrationsFromRepository();
    } finally {
      this.switchingWorkspaceState.next(false);
    }
  }

  private async setSignedInUser(signedInUser: User): Promise<void> {
    await this.keyChainService.saveSecret(constants.appName, this.teamSignedInUserKeychainKey, JSON.stringify(signedInUser));
    this.signedInUserState.next(signedInUser);
  }

  private async getKeychainCurrentWorkspace(): Promise<string> {
    return await this.keyChainService.getSecret(constants.appName, constants.currentWorkspaceKeychainKey);
  }

  private async setKeychainCurrentWorkspace(workspaceName: string): Promise<void> {
    await this.keyChainService.saveSecret(constants.appName, constants.currentWorkspaceKeychainKey, workspaceName);
  }

  private async setLocalWorkspace(): Promise<void> {
    await this.setKeychainCurrentWorkspace(constants.localWorkspaceKeychainValue);
    await this.refreshWorkspaceState();
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
    } else if (
      localSecret.secretType === SecretType.awsIamRoleChainedSession &&
      !this.isOrphanedChainedSession(localSecret as AwsIamRoleChainedLocalSessionDto)
    ) {
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

  private isOrphanedChainedSession(localSessionDto: AwsIamRoleChainedLocalSessionDto): boolean {
    return localSessionDto.assumerSessionId === undefined && localSessionDto.assumerIntegrationId === undefined;
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
