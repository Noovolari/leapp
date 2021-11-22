import { Injectable } from '@angular/core';
import {AwsSsoOidcService} from './aws-sso-oidc.service';
import {WorkspaceService} from './workspace.service';
import {AwsSsoIntegration} from '../models/aws-sso-integration';
import SSO, {
  AccountInfo,
  ListAccountRolesRequest,
  ListAccountsRequest,
  LogoutRequest,
  RoleInfo
} from 'aws-sdk/clients/sso';
import {environment} from '../../environments/environment';
import {AwsSsoIntegrationTokenInfo} from '../models/aws-sso-integration-token-info';
import {KeychainService} from './keychain.service';
import {AwsSsoRoleService, LoginResponse, SsoRoleSession} from './session/aws/methods/aws-sso-role.service';
import {AwsSsoRoleSession} from '../models/aws-sso-role-session';
import {SessionType} from '../models/session-type';
import {AppService, LoggerLevel} from './app.service';
import {LeappBaseError} from '../errors/leapp-base-error';

export class AwsSsoIntegrationService {

  private static instance: AwsSsoIntegrationService;
  private ssoPortal: SSO;
  private appService: AppService;
  private awsSsoOidcService: AwsSsoOidcService;
  private awsSsoRoleService: AwsSsoRoleService;
  private keychainService: KeychainService;
  private workspaceService: WorkspaceService;

  private constructor(
    appService: AppService,
    awsSsoOidcService: AwsSsoOidcService,
    awsSsoRoleService: AwsSsoRoleService,
    keychainService: KeychainService,
    workspaceService: WorkspaceService
  ) {
    this.appService = appService;
    this.awsSsoOidcService = awsSsoOidcService;
    this.awsSsoRoleService = awsSsoRoleService;
    this.keychainService = keychainService;
    this.workspaceService = workspaceService;
  }

  static getInstance(): AwsSsoIntegrationService  {
    if(!this.instance) {
      throw new LeappBaseError('AwsSsoIntegrationService singleton initialization error', this, LoggerLevel.error, 'AwsSsoIntegrationService singleton not yet initialized');
    } else {
      return this.instance;
    }
  }

  static init(
    appService: AppService,
    awsSsoOidcService: AwsSsoOidcService,
    awsSsoRoleService: AwsSsoRoleService,
    keychainService: KeychainService,
    workspaceService: WorkspaceService
  ) {
    this.instance = new AwsSsoIntegrationService(
      appService,
      awsSsoOidcService,
      awsSsoRoleService,
      keychainService,
      workspaceService
    );
  }

  async login(awsSsoIntegrationId: string): Promise<LoginResponse> {
    const awsSsoIntegration = this.workspaceService.getAwsSsoIntegration(awsSsoIntegrationId);

    const followRedirectClient = this.appService.getFollowRedirects()[AwsSsoRoleService.getProtocol(awsSsoIntegration.portalUrl)];

    awsSsoIntegration.portalUrl = await new Promise( (resolve, _) => {
      const request = followRedirectClient.request(awsSsoIntegration.portalUrl, response => resolve(response.responseUrl));
      request.end();
    });

    const generateSsoTokenResponse = await this.awsSsoOidcService.login(awsSsoIntegration);
    return {
      portalUrlUnrolled: awsSsoIntegration.portalUrl,
      accessToken: generateSsoTokenResponse.accessToken,
      region: awsSsoIntegration.region,
      expirationTime: generateSsoTokenResponse.expirationTime
    };
  }

  async sync(awsSsoIntegrationId: string) {
    const awsSsoIntegration = this.workspaceService.getAwsSsoIntegration(awsSsoIntegrationId);

    const region = awsSsoIntegration.region;
    const accessToken = await this.getAccessToken(awsSsoIntegration);

    const sessions = await this.provisionSessions(awsSsoIntegration.id, accessToken, region);

    const sessionsToBeRemoved = this.workspaceService.getAwsSsoIntegrationSessions(awsSsoIntegration.id);

    for (let i = 0; i < sessionsToBeRemoved.length; i++) {
      const sess = sessionsToBeRemoved[i];

      const iamRoleChainedSessions = this.awsSsoRoleService.listIamRoleChained(sess);

      for (let j = 0; j < iamRoleChainedSessions.length; j++) {
        await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId);
      }

      await this.awsSsoRoleService.stop(sess.sessionId);

      this.workspaceService.removeSession(sess.sessionId);
    }

    return sessions;
  }

  async logout(awsSsoIntegrationId: string): Promise<void> {
    const awsSsoIntegration = this.workspaceService.getAwsSsoIntegration(awsSsoIntegrationId);

    const region = awsSsoIntegration.region;
    const awsSsoIntegrationAccessToken = (await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegration.id)).accessToken;

    this.getSsoPortalClient(region);

    const logoutRequest: LogoutRequest = { accessToken: awsSsoIntegrationAccessToken };

    this.ssoPortal.logout(logoutRequest).promise().then(_ => {}, async _ => {
      this.ssoPortal = null;

      try {
        await this.keychainService.deletePassword(environment.appName, `aws-sso-integration-access-token-${awsSsoIntegrationId}`);
      } catch(err) {}

      this.workspaceService.unsetAwsSsoIntegrationExpiration(awsSsoIntegration.id);

      const sessions = this.workspaceService.getAwsSsoIntegrationSessions(awsSsoIntegration.id);

      for (let i = 0; i < sessions.length; i++) {
        const sess = sessions[i];

        const iamRoleChainedSessions = this.awsSsoRoleService.listIamRoleChained(sess);

        for (let j = 0; j < iamRoleChainedSessions.length; j++) {
          await this.awsSsoRoleService.delete(iamRoleChainedSessions[j].sessionId);
        }

        await this.awsSsoRoleService.stop(sess.sessionId);

        this.workspaceService.removeSession(sess.sessionId);
      }
    });
  }

  async provisionSessions(configurationId: string, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    const accounts: AccountInfo[] = await this.listAccounts(accessToken, region);

    const promiseArray: Promise<SsoRoleSession[]>[] = [];

    accounts.forEach((account) => {
      promiseArray.push(this.getSessionsFromAccount(configurationId, account, accessToken, region));
    });

    return new Promise( (resolve, _) => {
      Promise.all(promiseArray).then( (sessionMatrix: SsoRoleSession[][]) => {
        resolve(sessionMatrix.flat());
      });
    });
  }

  async getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId: string): Promise<AwsSsoIntegrationTokenInfo> {
    const accessToken = await this.keychainService.getSecret(environment.appName, `aws-sso-integration-access-token-${awsSsoIntegrationId}`);
    const expiration = new Date(this.workspaceService.getAwsSsoIntegration(awsSsoIntegrationId).accessTokenExpiration).getTime();
    return { accessToken, expiration };
  }

  async isAwsSsoAccessTokenExpired(awsSsoIntegrationId: string): Promise<boolean> {
    const awsSsoAccessTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegrationId);
    return !awsSsoAccessTokenInfo.expiration || awsSsoAccessTokenInfo.expiration < Date.now();
  }

  async getAccessToken(awsSsoIntegration: AwsSsoIntegration): Promise<string> {
    if (await this.isAwsSsoAccessTokenExpired(awsSsoIntegration.id)) {
      const loginResponse = await this.login(awsSsoIntegration.id);

      this.workspaceService.updateAwsSsoIntegration(
        awsSsoIntegration.id,
        awsSsoIntegration.alias,
        awsSsoIntegration.region,
        loginResponse.portalUrlUnrolled,
        awsSsoIntegration.browserOpening,
        loginResponse.expirationTime.toISOString()
      );

      this.keychainService.saveSecret(environment.appName, `aws-sso-integration-access-token-${awsSsoIntegration.id}`, loginResponse.accessToken).then(_ => {});

      return loginResponse.accessToken;
    } else {
      const awsSsoIntegrationTokenInfo = await this.getAwsSsoIntegrationTokenInfo(awsSsoIntegration.id);
      return awsSsoIntegrationTokenInfo.accessToken;
    }
  }

  // TODO: move to SsoPortalSingleton
  private getSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region});
    }
  }

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.getSsoPortalClient(region);

    const listAccountsRequest: ListAccountsRequest = { accessToken, maxResults: 30 };
    const accountList: AccountInfo[] = [];

    return new Promise( (resolve, _) => {
      this.recursiveListAccounts(accountList, listAccountsRequest, resolve);
    });
  }

  private recursiveListAccounts(accountList: AccountInfo[], listAccountsRequest: ListAccountsRequest, promiseCallback: any) {
    this.ssoPortal.listAccounts(listAccountsRequest).promise().then(response => {
      accountList.push(...response.accountList);

      if (response.nextToken !== null) {
        listAccountsRequest.nextToken = response.nextToken;
        this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback);
      } else {
        promiseCallback(accountList);
      }
    });
  }

  private async getSessionsFromAccount(configurationId: string, accountInfo: AccountInfo, accessToken: string, region: string): Promise<SsoRoleSession[]> {
    this.getSsoPortalClient(region);

    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30 // TODO: find a proper value
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
        region: oldSession?.region || this.workspaceService.getWorkspace().defaultRegion || environment.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
        profileId: oldSession?.profileId || this.workspaceService.getDefaultProfileId(),
        awsSsoConfigurationId: configurationId
      };

      awsSsoSessions.push(awsSsoSession);
    });

    return awsSsoSessions;
  }

  private recursiveListRoles(accountRoles: RoleInfo[], listAccountRolesRequest: ListAccountRolesRequest, promiseCallback: any) {
    this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise().then(response => {
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
    for (let i = 0; i < this.workspaceService.sessions.length; i++) {
      const sess = this.workspaceService.sessions[i];

      if(sess.type === SessionType.awsSsoRole) {
        if (
          ((sess as AwsSsoRoleSession).email === accountInfo.emailAddress ) &&
          ((sess as AwsSsoRoleSession).roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}` )
        ) {
          return { region: (sess as AwsSsoRoleSession).region, profileId: (sess as AwsSsoRoleSession).profileId };
        }
      }
    }

    return undefined;
  }
}
