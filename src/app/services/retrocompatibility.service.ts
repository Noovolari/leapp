import {Injectable} from '@angular/core';
import {AppService} from './app.service';
import {environment} from '../../environments/environment';
import {FileService} from './file.service';
import {Workspace} from '../models/workspace';
import {serialize} from 'class-transformer';
import {KeychainService} from './keychain.service';
import {AwsIamRoleFederatedSession} from '../models/aws-iam-role-federated-session';
import {AwsIamRoleChainedSession} from '../models/aws-iam-role-chained-session';
import {AwsIamUserSession} from '../models/aws-iam-user-session';
import {AwsSsoRoleSession} from '../models/aws-sso-role-session';
import {AzureSession} from '../models/azure-session';
import {WorkspaceService} from './workspace.service';
import {Constants} from '../models/constants';
import * as uuid from 'uuid';
import {SessionType} from '../models/session-type';

@Injectable({
  providedIn: 'root'
})
export class RetrocompatibilityService {

  constructor(
    private appService: AppService,
    private fileService: FileService,
    private keychainService: KeychainService,
    private workspaceService: WorkspaceService
  ) { }

  private static adaptIdpUrls(oldWorkspace: any, workspace: any) {
    workspace._idpUrls = oldWorkspace.workspaces[0].idpUrl;
  }

  private static adaptProxyConfig(oldWorkspace: any, workspace: any) {
    workspace._proxyConfiguration = oldWorkspace.workspaces[0].proxyConfiguration;
  }

  private static adaptGeneralProperties(oldWorkspace: any, workspace: any) {
    workspace._defaultRegion   = oldWorkspace.workspaces[0].defaultRegion;
    workspace._defaultLocation = oldWorkspace.workspaces[0].defaultLocation;
  }

  private static createNewAwsFederatedOrIamRoleChainedSession(session: any, workspace: any) {
    if(!session.account.parent) {
      // Federated
      const federatedSession = new AwsIamRoleFederatedSession(
        session.account.accountName,
        session.account.region,
        session.account.idpUrl,
        session.account.idpArn,
        session.account.role.roleArn,
        workspace._profiles[0].id
      );
      federatedSession.sessionId = session.id;

      workspace._sessions.push(federatedSession);
    } else {
      // IamRoleChained
      const iamRoleChainedSession = new AwsIamRoleChainedSession(
        session.account.accountName,
        session.account.region,
        session.account.role.roleArn,
        workspace.profiles[0].id,
        session.account.parent
      );
      iamRoleChainedSession.sessionId = session.id;

      workspace._sessions.push(iamRoleChainedSession);
    }
  }

  private static createNewAwsSingleSignOnSession(session: any, workspace: any) {
    const ssoSession = new AwsSsoRoleSession(
      session.account.accountName,
      session.account.region,
      `arn:aws:iam::${session.account.accountNumber}:role/${session.account.role.name}`,
      workspace._profiles[0].id,
      undefined,
      session.account.email
    );
    ssoSession.sessionId = session.id;
    workspace._sessions.push(ssoSession);
  }

  private static createNewAzureSession(session: any, workspace: any) {
    const azureSession = new AzureSession(
      session.account.accountName,
      session.account.region,
      session.account.subscriptionId,
      session.account.tenantId
    );
    azureSession.sessionId = session.id;
    workspace._sessions.push(azureSession);
  }

  private static createNewAwsFederatedOrIamRoleChainedSessionNew(session: any, workspace: any) {
    if(!(session as AwsIamRoleChainedSession).parentSessionId) {
      // Federated
      const federatedSession = new AwsIamRoleFederatedSession(
        (session as AwsIamRoleFederatedSession).sessionName,
        (session as AwsIamRoleFederatedSession).region,
        (session as AwsIamRoleFederatedSession).idpUrlId,
        (session as AwsIamRoleFederatedSession).idpArn,
        (session as AwsIamRoleFederatedSession).roleArn,
        workspace._profiles[0].id
      );
      federatedSession.sessionId = session.sessionId;

      workspace._sessions.push(federatedSession);
    } else {
      // IamRoleChained
      const iamRoleChainedSession = new AwsIamRoleChainedSession(
        (session as AwsIamRoleChainedSession).sessionName,
        (session as AwsIamRoleChainedSession).region,
        (session as AwsIamRoleChainedSession).roleArn,
        workspace.profiles[0].id,
        (session as AwsIamRoleChainedSession).parentSessionId
      );
      iamRoleChainedSession.sessionId = session.id;

      workspace._sessions.push(iamRoleChainedSession);
    }
  }

  private static createNewAwsSingleSignOnSessionNew(session: any, workspace: any) {
    const ssoSession = new AwsSsoRoleSession(
      (session as AwsSsoRoleSession).sessionName,
      (session as AwsSsoRoleSession).region,
      (session as AwsSsoRoleSession).roleArn,
      workspace._profiles[0].id,
      undefined,
      (session as AwsSsoRoleSession).email
    );
    ssoSession.sessionId = session.sessionId;
    workspace._sessions.push(ssoSession);
  }

  private static createNewAzureSessionNew(session: any, workspace: any) {
    const azureSession = new AzureSession(
      (session as AzureSession).sessionName,
      (session as AzureSession).region,
      (session as AzureSession).subscriptionId,
      (session as AzureSession).tenantId
    );
    azureSession.sessionId = session.sessionId;
    workspace._sessions.push(azureSession);
  }

  isRetroPatchNecessary(): boolean {
    if (this.fileService.exists(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)) {
      const workspaceParsed = this.parseWorkspaceFile();
      // use a never more used property to check if workspace has changed to new version
      // also check for new integration array if present or not
      return workspaceParsed.defaultWorkspace === 'default';
    }
    return false;
  }

  isIntegrationPatchNecessary(): boolean {
    if (this.fileService.exists(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)) {
      const workspaceParsed = this.parseWorkspaceFile();
      // check for new integration array if present or not
      return !workspaceParsed._awsSsoIntegrations || (workspaceParsed._awsSsoIntegrations.length === 0 && workspaceParsed._sessions.filter(s => s.type === 'awsSsoRole').length > 0);
    }
    return false;
  }

  async adaptOldWorkspaceFile(): Promise<Workspace> {
    (this.workspaceService as any).workspace = undefined;

    // We need to adapt Sessions, IdpUrls, AwsSso Config, Proxy Config
    const workspace: any = {
      _sessions: [],
      _defaultRegion: environment.defaultRegion,
      _defaultLocation: environment.defaultLocation,
      _idpUrls: [],
      _profiles: [
        { id: uuid.v4(), name: environment.defaultAwsProfileName }
      ],
      _awsSsoIntegrations: [],
      _proxyConfiguration: {
        proxyProtocol: 'https',
        proxyUrl: undefined,
        proxyPort: '8080',
        username: undefined,
        password: undefined
      }
    };
    const oldWorkspace = this.parseWorkspaceFile();

    // if there are no sessions, remove it, is useless, and let Leapp generate a fresh one
    if (oldWorkspace.workspaces.length === 0 || oldWorkspace.workspaces[0].sessions.length === 0) {
      // Just persist a fresh workspace data
      const freshWorkspace = new Workspace();
      this.persists(freshWorkspace);
      // Apply sessions to behaviour subject
      this.workspaceService.sessions = freshWorkspace.sessions;
      return freshWorkspace;
    } else {
      // Adapt data structure
      RetrocompatibilityService.adaptIdpUrls(oldWorkspace, workspace);
      RetrocompatibilityService.adaptProxyConfig(oldWorkspace, workspace);
      RetrocompatibilityService.adaptGeneralProperties(oldWorkspace, workspace);
      await this.adaptAwsSsoConfig(oldWorkspace, workspace);
      await this.adaptSessions(oldWorkspace, workspace);
      // Persist adapted workspace data
      this.persistsTemp(workspace);
      // Apply sessions to behaviour subject
      this.workspaceService.sessions = workspace._sessions;
      return workspace;
    }
  }

  async adaptIntegrationPatch(): Promise<Workspace> {

    const workspace = new Workspace();
    const oldWorkspace = this.parseWorkspaceFile();

    await this.adaptIntegrations(oldWorkspace, workspace);

    // Persist adapted workspace data
    this.persists(workspace);

    // Apply sessions to behaviour subject
    this.workspaceService.sessions = workspace.sessions;
    this.workspaceService.workspace = workspace;
    return workspace;
  }

  private parseWorkspaceFile(): any {
    const workspaceJSON = this.fileService.decryptText(
      this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)
    );
    return JSON.parse(workspaceJSON);
  }

  private persistsTemp(workspace: any): void {
    this.fileService.writeFileSync(
      this.appService.getOS().homedir() + '/' + environment.lockFileDestination,
      this.fileService.encryptText(JSON.stringify(workspace))
    );
  }

  private persists(workspace: Workspace): void {
    this.fileService.writeFileSync(
      this.appService.getOS().homedir() + '/' + environment.lockFileDestination,
      this.fileService.encryptText(serialize(workspace))
    );
  }

  private async adaptSessions(oldWorkspace: any, workspace: any): Promise<void> {
    const sessions = oldWorkspace.workspaces[0].sessions;

    // Loop through sessions and generate data
    for(let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      // Get sessions type
      const sessionType = session.account.type;
      switch (sessionType) {
        case 'AWS': RetrocompatibilityService.createNewAwsFederatedOrIamRoleChainedSession(session, workspace); break;
        case 'aws': RetrocompatibilityService.createNewAwsFederatedOrIamRoleChainedSession(session, workspace); break;
        case 'AWS_TRUSTER': RetrocompatibilityService.createNewAwsFederatedOrIamRoleChainedSession(session, workspace); break;
        case 'aws_truster': RetrocompatibilityService.createNewAwsFederatedOrIamRoleChainedSession(session, workspace); break;
        case 'AWS_PLAIN_USER': await this.createNewAwsIamUserSession(session, workspace); break;
        case 'aws_plain_user': await this.createNewAwsIamUserSession(session, workspace); break;
        case 'AWS_SSO': RetrocompatibilityService.createNewAwsSingleSignOnSession(session, workspace); break;
        case 'aws_sso': RetrocompatibilityService.createNewAwsSingleSignOnSession(session, workspace); break;
        case 'AZURE': RetrocompatibilityService.createNewAzureSession(session, workspace); break;
        case 'azure': RetrocompatibilityService.createNewAzureSession(session, workspace); break;
      }
    }
  }

  private async adaptNewSessions(oldWorkspace: any, workspace: any): Promise<void> {
    const sessions = oldWorkspace._sessions;

    // Loop through sessions and generate data
    for(let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      // Get sessions type
      const sessionType = session.type;
      switch (sessionType) {
        case SessionType.awsIamRoleFederated: RetrocompatibilityService.createNewAwsFederatedOrIamRoleChainedSessionNew(session, workspace); break;
        case SessionType.awsIamRoleChained: RetrocompatibilityService.createNewAwsFederatedOrIamRoleChainedSessionNew(session, workspace); break;
        case SessionType.awsIamUser: await this.createNewAwsIamUserSessionNew(session, workspace); break;
        case SessionType.awsSsoRole: RetrocompatibilityService.createNewAwsSingleSignOnSessionNew(session, workspace); break;
        case SessionType.azure: RetrocompatibilityService.createNewAzureSessionNew(session, workspace); break;
      }
    }
  }

  private async adaptAwsSsoConfig(oldWorkspace: any, workspace: any): Promise<void> {
    const sessions = oldWorkspace.workspaces[0].sessions;
    // check if we have at least one SSO sessions
    // otherwise standard generated properties are just fine
    for(let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      // We have changed the enum type so we must check it manually
      if (session.account.type === 'aws_sso' || session.account.type === 'AWS_SSO') {
        // OK, let's check if we have data saved in the keychain
        let region;
        let portalUrl;
        let expirationTime;
        let browserOpening;
        try {
          region = await this.keychainService.getSecret(environment.appName, 'AWS_SSO_REGION');
          portalUrl = await this.keychainService.getSecret(environment.appName, 'AWS_SSO_PORTAL_URL');
          expirationTime = await this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME');
          browserOpening = Constants.inApp.toString();
        } catch(err) {
          // we need all or nothing, otherwise it means that configuration is incomplete so its better
          // to force the user to redo the process on the new fresh workspace
        }

        workspace.awsSsoConfiguration = {
          region,
          portalUrl,
          expirationTime,
          browserOpening
        };
        break;
      }
    }
  }

  private async createNewAwsIamUserSession(session: any, workspace: any) {
    const iamUserSession = new AwsIamUserSession(
      session.account.accountName,
      session.account.region,
      workspace._profiles[0].id,
      session.account.mfaDevice
    );
    iamUserSession.sessionId = session.id;

    const accessKey = await this.keychainService.getSecret(
      environment.appName, `${session.account.accountName}___${session.account.user}___accessKey`);

    const secretKey = await this.keychainService.getSecret(
      environment.appName, `${session.account.accountName}___${session.account.user}___secretKey`);

    await this.keychainService.saveSecret(environment.appName, `${session.id}-iam-user-aws-session-access-key-id`, accessKey);
    await this.keychainService.saveSecret(environment.appName, `${session.id}-iam-user-aws-session-secret-access-key`, secretKey);

    workspace._sessions.push(iamUserSession);
  }

  private async createNewAwsIamUserSessionNew(session: any, workspace: any) {
    const iamUserSession = new AwsIamUserSession(
      (session as AwsIamUserSession).sessionName,
      (session as AwsIamUserSession).region,
      workspace._profiles[0].id,
      (session as AwsIamUserSession).mfaDevice
    );

    console.log(workspace, workspace._profiles[0].id);

    iamUserSession.sessionId = session.sessionId;

    workspace._sessions.push(iamUserSession);
  }

  private async adaptIntegrations(oldWorkspace: any, workspace: Workspace) {
    if(!workspace.awsSsoIntegrations) {
      workspace.awsSsoIntegrations = [];
    }

    workspace.idpUrls = oldWorkspace._idpUrls;
    workspace.profiles = oldWorkspace._profiles;
    workspace.proxyConfiguration = oldWorkspace._proxyConfiguration;
    workspace.defaultRegion   = oldWorkspace._defaultRegion;
    workspace.defaultLocation = oldWorkspace._defaultLocation;
    await this.adaptNewSessions(oldWorkspace, workspace);

    // Get AWS SSO Configuration from both intermediate and old configs
    const awsSsoConfiguration = oldWorkspace._awsSsoConfiguration || oldWorkspace.awsSsoConfiguration;

    if(workspace.sessions.filter(sess => sess.type === SessionType.awsSsoRole.toString()).length > 0) {

      if(workspace.awsSsoIntegrations.length === 0) {
        workspace.awsSsoIntegrations.push({
          id: uuid.v4(),
          alias: 'Aws Single Sign-On',
          region: awsSsoConfiguration.region,
          portalUrl: awsSsoConfiguration.portalUrl,
          accessTokenExpiration: awsSsoConfiguration.expirationTime,
          browserOpening: Constants.inApp
        });

        try {
          const accessToken = await this.keychainService.getSecret(environment.appName, `aws-sso-access-token`);
          await this.keychainService.saveSecret(environment.appName, `aws-sso-integration-access-token-${workspace.awsSsoIntegrations[0].id}`, accessToken);
        } catch (_) {}
      }

      for (let i = 0; i < workspace.sessions.length; i++) {
        const session = workspace.sessions[i];
        // We have changed the enum type so we must check it manually
        if (session.type === SessionType.awsSsoRole.toString()) {
          (session as AwsSsoRoleSession).awsSsoConfigurationId = workspace.awsSsoIntegrations[0].id;
          workspace.sessions[i] = session;
        }
      }
    }
  }
}
