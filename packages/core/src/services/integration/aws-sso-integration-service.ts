import { Repository } from "../repository";
import { AwsSsoRoleService, LoginResponse, SsoRoleSession } from "../session/aws/aws-sso-role-service";
import { AwsSsoIntegration } from "../../models/aws/aws-sso-integration";
import { formatDistance } from "date-fns";
import { INativeService } from "../../interfaces/i-native-service";
import { AwsSsoOidcService } from "../aws-sso-oidc.service";
import { KeychainService } from "../keychain-service";
import { constants } from "../../models/constants";
import SSO, {
  AccountInfo,
  GetRoleCredentialsRequest,
  GetRoleCredentialsResponse,
  ListAccountRolesRequest,
  ListAccountsRequest,
  LogoutRequest,
  RoleInfo,
} from "aws-sdk/clients/sso";
import { SessionType } from "../../models/session-type";
import { AwsSsoRoleSession } from "../../models/aws/aws-sso-role-session";
import { IBehaviouralNotifier } from "../../interfaces/i-behavioural-notifier";
import { AwsSsoIntegrationTokenInfo } from "../../models/aws/aws-sso-integration-token-info";
import { SessionFactory } from "../session-factory";
import { IIntegrationService } from "../../interfaces/i-integration-service";
import { AwsSsoIntegrationCreationParams } from "../../models/aws/aws-sso-integration-creation-params";

const portalUrlValidationRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

/*
const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};
 */

export interface SsoSessionsDiff {
  sessionsToDelete: AwsSsoRoleSession[];
  sessionsToAdd: SsoRoleSession[];
}

export class AwsSsoIntegrationService implements IIntegrationService {
  private ssoPortal: SSO;

  constructor(
    public repository: Repository,
    public keyChainService: KeychainService,
    public behaviouralNotifier: IBehaviouralNotifier,
    public nativeService: INativeService,
    public sessionFactory: SessionFactory,
    private awsSsoOidcService: AwsSsoOidcService,
    private awsSsoRoleService: AwsSsoRoleService
  ) {}

  static validateAlias(alias: string): boolean | string {
    return alias.trim() !== "" ? true : "Empty alias";
  }

  static validatePortalUrl(portalUrl: string): boolean | string {
    return portalUrlValidationRegex.test(portalUrl) ? true : "Invalid portal URL";
  }

  async createIntegration(creationParams: AwsSsoIntegrationCreationParams): Promise<void> {
    this.repository.addAwsSsoIntegration(creationParams.portalUrl, creationParams.alias, creationParams.region, creationParams.browserOpening);
  }

  updateIntegration(id: string, updateParams: AwsSsoIntegrationCreationParams): void {
    const isOnline = this.repository.getAwsSsoIntegration(id).isOnline;
    this.repository.updateAwsSsoIntegration(
      id,
      updateParams.alias,
      updateParams.region,
      updateParams.portalUrl,
      updateParams.browserOpening,
      isOnline
    );
  }

  getIntegration(id: string): AwsSsoIntegration {
    return this.repository.getAwsSsoIntegration(id);
  }

  getIntegrations(): AwsSsoIntegration[] {
    return this.repository.listAwsSsoIntegrations();
  }

  async setOnline(integration: AwsSsoIntegration, forcedState?: boolean): Promise<void> {
    const expiration = new Date(integration.accessTokenExpiration).getTime();
    const now = this.getDate().getTime();
    const isOnline = !!integration.accessTokenExpiration && now < expiration;

    integration.isOnline = forcedState || isOnline;

    this.repository.updateAwsSsoIntegration(
      integration.id,
      integration.alias,
      integration.region,
      integration.portalUrl,
      integration.browserOpening,
      integration.isOnline,
      integration.accessTokenExpiration
    );
  }

  remainingHours(integration: AwsSsoIntegration): string {
    return formatDistance(new Date(integration.accessTokenExpiration), this.getDate(), { addSuffix: true });
  }

  async loginAndGetSessionsDiff(integrationId: string): Promise<SsoSessionsDiff> {
    const awsSsoIntegration = this.repository.getAwsSsoIntegration(integrationId);
    const region = awsSsoIntegration.region;
    const portalUrl = awsSsoIntegration.portalUrl;
    const accessToken = await this.getAccessToken(integrationId, region, portalUrl);

    const onlineSessions = await this.getSessions(integrationId, accessToken, region);
    const persistedSessions = this.repository.getAwsSsoIntegrationSessions(integrationId);

    const sessionsToDelete: AwsSsoRoleSession[] = [];
    for (const persistedSession of persistedSessions) {
      const shouldBeDeleted = !onlineSessions.find((s) => {
        const ssoRoleSession = persistedSession as unknown as SsoRoleSession;
        return ssoRoleSession.sessionName === s.sessionName && ssoRoleSession.roleArn === s.roleArn && ssoRoleSession.email === s.email;
      });
      if (shouldBeDeleted) {
        sessionsToDelete.push(persistedSession as AwsSsoRoleSession);
      }
    }

    const sessionsToAdd = [];
    for (const onlineSession of onlineSessions) {
      const shouldBeCreated = !persistedSessions.find((persistedSession) => {
        const session = persistedSession as unknown as SsoRoleSession;
        return (
          onlineSession.sessionName === session.sessionName && onlineSession.roleArn === session.roleArn && onlineSession.email === session.email
        );
      });
      if (shouldBeCreated) {
        sessionsToAdd.push(onlineSession);
      }
    }

    await this.setOnline(awsSsoIntegration, true);
    this.behaviouralNotifier.setIntegrations([...this.repository.listAwsSsoIntegrations(), ...this.repository.listAzureIntegrations()]);

    return { sessionsToDelete, sessionsToAdd };
  }

  async syncSessions(integrationId: string): Promise<SsoSessionsDiff> {
    const sessionsDiff = await this.loginAndGetSessionsDiff(integrationId);

    for (const ssoRoleSession of sessionsDiff.sessionsToAdd) {
      ssoRoleSession.awsSsoConfigurationId = integrationId;
      await this.awsSsoRoleService.create(ssoRoleSession);
    }

    for (const ssoSession of sessionsDiff.sessionsToDelete) {
      const sessionService = this.sessionFactory.getSessionService(ssoSession.type);
      await sessionService.delete(ssoSession.sessionId);
    }

    return sessionsDiff;
  }

  async logout(integrationId: string): Promise<void> {
    // Obtain region and access token
    const integration: AwsSsoIntegration = this.repository.getAwsSsoIntegration(integrationId);
    const region = integration.region;
    const savedAccessToken = await this.getAccessTokenFromKeychain(integrationId);

    // Configure Sso Portal Client
    this.setupSsoPortalClient(region);

    // Make a logout request to Sso
    const logoutRequest: LogoutRequest = { accessToken: savedAccessToken };

    try {
      await this.ssoPortal.logout(logoutRequest).promise();
    } catch (_) {
      // logout request has to be handled in reject Promise by design

      // Clean clients
      this.ssoPortal = null;

      // Delete access token and remove sso integration info from workspace
      await this.keyChainService.deletePassword(constants.appName, this.getIntegrationAccessTokenKey(integrationId));
      this.repository.unsetAwsSsoIntegrationExpiration(integrationId);
    }

    await this.setOnline(integration, false);
    this.behaviouralNotifier.setIntegrations([...this.repository.listAwsSsoIntegrations(), ...this.repository.listAzureIntegrations()]);
  }

  async getAccessToken(integrationId: string, region: string, portalUrl: string): Promise<string> {
    const isAwsSsoAccessTokenExpired = await this.isAwsSsoAccessTokenExpired(integrationId);

    if (isAwsSsoAccessTokenExpired) {
      const loginResponse = await this.login(integrationId, region, portalUrl);
      const integration: AwsSsoIntegration = this.repository.getAwsSsoIntegration(integrationId);

      const d = new Date();
      d.setMinutes(d.getMinutes() + 1);

      await this.configureAwsSso(
        integrationId,
        integration.alias,
        region,
        loginResponse.portalUrlUnrolled,
        integration.browserOpening,
        d.toISOString(), // loginResponse.expirationTime.toISOString(),
        loginResponse.accessToken
      );

      return loginResponse.accessToken;
    } else {
      return await this.getAccessTokenFromKeychain(integrationId);
    }
  }

  async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.setupSsoPortalClient(region);

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split("/")[1],
      accessToken,
    };

    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise();
  }

  async getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId: string): Promise<AwsSsoIntegrationTokenInfo> {
    const accessToken = await this.keyChainService.getSecret(constants.appName, `aws-sso-integration-access-token-${awsSsoIntegrationId}`);
    const expiration = this.repository.getAwsSsoIntegration(awsSsoIntegrationId)
      ? new Date(this.repository.getAwsSsoIntegration(awsSsoIntegrationId).accessTokenExpiration).getTime()
      : undefined;
    return { accessToken, expiration };
  }

  async isAwsSsoAccessTokenExpired(awsSsoIntegrationId: string): Promise<boolean> {
    const awsSsoAccessTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId);
    return !awsSsoAccessTokenInfo.expiration || awsSsoAccessTokenInfo.expiration < Date.now();
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    await this.logout(integrationId);
    this.repository.deleteAwsSsoIntegration(integrationId);
    this.deleteDependentSessions(integrationId);
  }

  private async getSessions(integrationId: string, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    const accounts: AccountInfo[] = await this.listAccounts(accessToken, region);

    const promiseArray: Promise<SsoRoleSession[]>[] = [];

    accounts.forEach((account) => {
      promiseArray.push(this.getSessionsFromAccount(integrationId, account, accessToken, region));
    });

    return new Promise((resolve, _) => {
      Promise.all(promiseArray).then((sessionMatrix: SsoRoleSession[][]) => {
        resolve(sessionMatrix.flat());
      });
    });
  }

  private async configureAwsSso(
    integrationId: string,
    alias: string,
    region: string,
    portalUrl: string,
    browserOpening: string,
    expirationTime: string,
    accessToken: string
  ): Promise<void> {
    const isOnline = this.repository.getAwsSsoIntegration(integrationId).isOnline;
    this.repository.updateAwsSsoIntegration(integrationId, alias, region, portalUrl, browserOpening, isOnline, expirationTime);
    await this.keyChainService.saveSecret(constants.appName, this.getIntegrationAccessTokenKey(integrationId), accessToken);
  }

  private async getAccessTokenFromKeychain(integrationId: string | number): Promise<string> {
    return await this.keyChainService.getSecret(constants.appName, this.getIntegrationAccessTokenKey(integrationId));
  }

  private getIntegrationAccessTokenKey(integrationId: string | number) {
    return `aws-sso-integration-access-token-${integrationId}`;
  }

  private async login(integrationId: string | number, region: string, portalUrl: string): Promise<LoginResponse> {
    const redirectClient = this.nativeService.followRedirects[this.getProtocol(portalUrl)];
    portalUrl = await new Promise((resolve, _) => {
      const request = redirectClient.request(portalUrl, (response) => resolve(response.responseUrl));
      request.end();
    });

    const generateSsoTokenResponse = await this.awsSsoOidcService.login(integrationId, region, portalUrl);

    return {
      portalUrlUnrolled: portalUrl,
      accessToken: generateSsoTokenResponse.accessToken,
      region,
      expirationTime: generateSsoTokenResponse.expirationTime,
    };
  }

  private async removeSsoSessionsFromWorkspace(integrationId: string): Promise<void> {
    const ssoSessions = this.repository.getAwsSsoIntegrationSessions(integrationId);
    for (const ssoSession of ssoSessions) {
      const sessionService = this.sessionFactory.getSessionService(ssoSession.type);
      await sessionService.delete(ssoSession.sessionId);
    }
  }

  private setupSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({ region });
    }
  }

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.setupSsoPortalClient(region);

    const listAccountsRequest: ListAccountsRequest = { accessToken, maxResults: 30 };
    const accountList: AccountInfo[] = [];

    return new Promise((resolve, _) => {
      this.recursiveListAccounts(accountList, listAccountsRequest, resolve);
    });
  }

  private recursiveListAccounts(accountList: AccountInfo[], listAccountsRequest: ListAccountsRequest, promiseCallback: any) {
    this.ssoPortal
      .listAccounts(listAccountsRequest)
      .promise()
      .then((response) => {
        accountList.push(...response.accountList);

        if (response.nextToken !== null) {
          listAccountsRequest.nextToken = response.nextToken;
          this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback);
        } else {
          promiseCallback(accountList);
        }
      });
  }

  private async getSessionsFromAccount(
    integrationId: string,
    accountInfo: AccountInfo,
    accessToken: string,
    region: string
  ): Promise<SsoRoleSession[]> {
    this.setupSsoPortalClient(region);

    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30, // TODO: find a proper value
    };

    const accountRoles: RoleInfo[] = [];

    await new Promise((resolve, _) => {
      this.recursiveListRoles(accountRoles, listAccountRolesRequest, resolve);
    });

    const awsSsoSessions: SsoRoleSession[] = [];

    accountRoles.forEach((accountRole) => {
      const oldSession = this.findOldSession(accountInfo, accountRole);

      const awsSsoSession = {
        email: accountInfo.emailAddress,
        region: oldSession?.region || this.repository.getDefaultRegion() || constants.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
        profileId: oldSession?.profileId || this.repository.getDefaultProfileId(),
        awsSsoConfigurationId: integrationId,
      };

      awsSsoSessions.push(awsSsoSession);
    });

    return awsSsoSessions;
  }

  private recursiveListRoles(accountRoles: RoleInfo[], listAccountRolesRequest: ListAccountRolesRequest, promiseCallback: any) {
    this.ssoPortal
      .listAccountRoles(listAccountRolesRequest)
      .promise()
      .then((response) => {
        accountRoles.push(...response.roleList);

        if (response.nextToken !== null) {
          listAccountRolesRequest.nextToken = response.nextToken;
          this.recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback);
        } else {
          promiseCallback(accountRoles);
        }
      });
  }

  private findOldSession(accountInfo: SSO.AccountInfo, accountRole: SSO.RoleInfo): { region: string; profileId: string } {
    //TODO: use map and filter in order to make this method more readable
    for (let i = 0; i < this.repository.getSessions().length; i++) {
      const sess = this.repository.getSessions()[i];

      if (sess.type === SessionType.awsSsoRole) {
        if (
          (sess as AwsSsoRoleSession).email === accountInfo.emailAddress &&
          (sess as AwsSsoRoleSession).roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`
        ) {
          return { region: (sess as AwsSsoRoleSession).region, profileId: (sess as AwsSsoRoleSession).profileId };
        }
      }
    }

    return undefined;
  }

  private deleteDependentSessions(configurationId: string) {
    const ssoSessions = this.repository.getSessions().filter((session) => (session as any).awsSsoConfigurationId === configurationId);
    for (const session of ssoSessions) {
      this.repository.deleteSession(session.sessionId);
    }
    this.behaviouralNotifier.setSessions([...this.repository.getSessions()]);
  }

  private getProtocol(aliasedUrl: string): string {
    let protocol = aliasedUrl.split("://")[0];
    if (protocol.indexOf("http") === -1) {
      protocol = "https";
    }
    return protocol;
  }

  private getDate(): Date {
    return new Date();
  }
}
