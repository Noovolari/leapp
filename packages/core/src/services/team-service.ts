import axios, { AxiosRequestConfig } from "axios";
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
import { EncryptionProvider } from "leapp-team-core/encryption/encryption.provider";
import { VaultProvider } from "leapp-team-core/vault/vault-provider";
import { UserProvider } from "leapp-team-core/user/user.provider";
import { HttpClientInterface } from "leapp-team-core/http/HttpClientInterface";
import { User } from "leapp-team-core/user/user";
import { SecretType } from "leapp-team-core/encryptable-dto/secret-type";
import { AwsIamFederatedLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-federated-local-session-dto";
import { AwsSsoLocalIntegrationDto } from "leapp-team-core/encryptable-dto/aws-sso-local-integration-dto";
import { AwsIamRoleChainedLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-role-chained-local-session-dto";
import { AzureLocalIntegrationDto } from "leapp-team-core/encryptable-dto/azure-local-integration-dto";
import { IKeychainService } from "../interfaces/i-keychain-service";
import { constants } from "../models/constants";
import { BehaviorSubject } from "rxjs";
import { INativeService } from "../interfaces/i-native-service";
import { FileService } from "./file-service";
import { Repository } from "./repository";
import { WorkspaceService } from "./workspace-service";
import { BehaviouralSubjectService } from "./behavioural-subject-service";

export class TeamService {
  readonly signedInUser$: BehaviorSubject<User>;
  private readonly teamSignedInUserKeychainKey = "team-signed-in-user";

  private readonly encryptionProvider: EncryptionProvider;
  private readonly vaultProvider: VaultProvider;
  private readonly userProvider: UserProvider;
  private readonly currentWorkspacePath: string;
  private readonly localWorkspacePath: string;

  constructor(
    private readonly sessionFactory: SessionFactory,
    private readonly namedProfilesService: NamedProfilesService,
    private readonly sessionManagementService: SessionManagementService,
    private readonly awsSsoIntegrationService: AwsSsoIntegrationService,
    private readonly azureIntegrationService: AzureIntegrationService,
    private readonly idpUrlService: IdpUrlsService,
    private readonly keyChainService: IKeychainService,
    private readonly nativeService: INativeService,
    private readonly fileService: FileService,
    private readonly repository: Repository,
    private readonly crypto: Crypto,
    private readonly workspaceService: WorkspaceService,
    private readonly behaviouralSubjectService?: BehaviouralSubjectService
  ) {
    const apiEndpoint = "http://localhost:3000";
    const httpClient: HttpClientInterface = {
      get: async <T>(url: string): Promise<T> => (await axios.get<T>(url, this.getHttpClientConfig())).data,
      post: async <T>(url: string, body: any): Promise<T> => (await axios.post<T>(url, body, this.getHttpClientConfig())).data,
      put: async <T>(url: string, body: any): Promise<T> => (await axios.put<T>(url, body, this.getHttpClientConfig())).data,
      delete: async <T>(url: string): Promise<T> => (await axios.delete<T>(url, this.getHttpClientConfig())).data,
    };
    this.encryptionProvider = new EncryptionProvider(crypto);
    this.vaultProvider = new VaultProvider(apiEndpoint, httpClient, this.encryptionProvider);
    this.userProvider = new UserProvider(apiEndpoint, httpClient, this.encryptionProvider);
    this.signedInUser$ = new BehaviorSubject(undefined);
    this.currentWorkspacePath = this.nativeService.os.homedir() + "/" + constants.lockFileDestination;
    this.localWorkspacePath = this.nativeService.os.homedir() + "/" + constants.lockFileDestination + ".local";
    this.signedInUser$.next(null);
  }

  async checkSignedInUser(): Promise<boolean> {
    const signedInUser = JSON.parse(await this.keyChainService.getSecret(constants.appName, this.teamSignedInUserKeychainKey)) as User;
    if (signedInUser && this.isJwtTokenExpired(signedInUser.accessToken)) {
      await this.signOut();
    }
    this.signedInUser$.next(signedInUser);
    return signedInUser !== null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const signerInUser = await this.userProvider.signIn(email, password);
    await this.setSignedInUser(signerInUser);
  }

  async setSignedInUser(signedInUser: User): Promise<void> {
    if (signedInUser !== undefined) {
      await this.keyChainService.saveSecret(constants.appName, "team-signed-in-user", JSON.stringify(signedInUser));
    } else {
      await this.keyChainService.deleteSecret(constants.appName, "team-signed-in-user");
    }

    this.signedInUser$.next(signedInUser);
  }

  async signOut(): Promise<void> {
    await this.setSignedInUser(undefined);
    await this.setWorkspaceToLocalOne();
  }

  async syncSecrets(): Promise<LocalSecretDto[]> {
    if (!(await this.checkSignedInUser())) {
      return;
    }
    // Check if ~/.Leapp/Leapp-lock.json.local does not exist
    if (!this.isRemoteWorkspace()) {
      // Create ~/.Leapp/Leapp-lock.json.local
      await this.setWorkspaceToRemoteOne();
    }
    this.workspaceService.removeWorkspace();
    this.workspaceService.createWorkspace();
    this.workspaceService.reloadWorkspace();
    this.behaviouralSubjectService.reloadSessionsAndIntegrationsFromRepository();
    const rsaKeys = await this.getRSAKeys(this.signedInUser$.getValue());
    const localSecretDtos = await this.vaultProvider.getSecrets(rsaKeys.privateKey);
    const integrationDtos = localSecretDtos.filter(
      (secret) => secret.secretType === SecretType.awsSsoIntegration || secret.secretType === SecretType.azureIntegration
    );
    for (const integrationDto of integrationDtos) {
      await this.syncIntegrationSecret(integrationDto as AwsSsoLocalIntegrationDto);
    }
    const sessionsDtos = localSecretDtos.filter((secret) => secret.secretType !== SecretType.awsSsoIntegration);
    for (const sessionDto of sessionsDtos) {
      await this.syncSessionsSecret(sessionDto);
    }
    return localSecretDtos;
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
      if (ssoSessions.length < 0) {
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

  private getHttpClientConfig(): AxiosRequestConfig {
    const signedInUser = this.signedInUser$.getValue();
    return signedInUser !== undefined ? { headers: { ["Authorization"]: `Bearer ${signedInUser.accessToken}` } } : {};
  }

  private isJwtTokenExpired(jwtToken: string): boolean {
    const expiry = JSON.parse(atob(jwtToken.split(".")[1])).exp;
    return Math.floor(new Date().getTime() / 1000) >= expiry;
  }

  private setWorkspaceToLocalOne(): void {
    if (this.fileService.existsSync(this.localWorkspacePath)) {
      const workspaceString = this.fileService.readFileSync(this.localWorkspacePath);
      this.fileService.writeFileSync(this.currentWorkspacePath, workspaceString);
      this.repository.reloadWorkspace();
      this.fileService.removeFileSync(this.localWorkspacePath);
    }
  }

  private setWorkspaceToRemoteOne(): void {
    const tempWorkspace = this.fileService.readFileSync(this.currentWorkspacePath);
    this.fileService.writeFileSync(this.localWorkspacePath, this.fileService.encryptText(JSON.stringify(tempWorkspace)));
  }

  private isRemoteWorkspace(): boolean {
    return this.fileService.existsSync(this.localWorkspacePath);
  }
}
