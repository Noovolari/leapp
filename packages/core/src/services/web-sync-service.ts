import * as crypto from "crypto";
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

export class WebSyncService {
  httpClient: HttpClientInterface;

  private readonly encryptionProvider: EncryptionProvider;
  private readonly vaultProvider: VaultProvider;
  private readonly userProvider: UserProvider;
  private currentUser: User;

  constructor(
    private readonly sessionFactory: SessionFactory,
    private readonly namedProfilesService: NamedProfilesService,
    private readonly sessionManagementService: SessionManagementService,
    private readonly awsSsoIntegrationService: AwsSsoIntegrationService,
    private readonly azureIntegrationService: AzureIntegrationService,
    private readonly idpUrlService: IdpUrlsService
  ) {
    this.httpClient = {
      get: async <T>(url: string): Promise<T> => (await axios.get<T>(url, this.getHttpClientConfig())).data,
      post: async <T>(url: string, body: any): Promise<T> => (await axios.post<T>(url, body, this.getHttpClientConfig())).data,
      put: async <T>(url: string, body: any): Promise<T> => (await axios.put<T>(url, body, this.getHttpClientConfig())).data,
      delete: async <T>(url: string): Promise<T> => (await axios.delete<T>(url, this.getHttpClientConfig())).data,
    };

    const apiEndpoint = "http://localhost:3000";
    this.encryptionProvider = new EncryptionProvider((crypto as any).webcrypto);
    this.vaultProvider = new VaultProvider(apiEndpoint, this.httpClient, this.encryptionProvider);
    this.userProvider = new UserProvider(apiEndpoint, this.httpClient, this.encryptionProvider);
  }

  async syncSecrets(email: string, password: string): Promise<LocalSecretDto[]> {
    this.currentUser = await this.userProvider.signIn(email, password);
    const rsaKeys = await this.getRSAKeys(this.currentUser);
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

  async syncIntegrationSecret(localIntegrationDto: LocalSecretDto): Promise<void> {
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

  async syncSessionsSecret(localSecret: LocalSecretDto): Promise<void> {
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

  async getAssumerSessionId(localSessionDto: AwsIamRoleChainedLocalSessionDto): Promise<string> {
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

  async setupAwsSession(sessionService: AwsSessionService, sessionId: string, profileName: string): Promise<string> {
    const localSession = this.sessionManagementService.getSessionById(sessionId) as AwsIamUserSession;
    if (localSession) {
      await sessionService.delete(sessionId);
      return localSession.profileId;
    } else {
      return this.namedProfilesService.mergeProfileName(profileName).id;
    }
  }

  async getRSAKeys(user: User): Promise<CryptoKeyPair> {
    const rsaKeyJsonPair = { privateKey: user.privateRSAKey, publicKey: user.publicRSAKey };
    return await this.encryptionProvider.importRsaKeys(rsaKeyJsonPair);
  }

  getHttpClientConfig(): AxiosRequestConfig {
    return this.currentUser
      ? {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Authorization: `Bearer ${this.currentUser.accessToken}` },
        }
      : {};
  }
}
