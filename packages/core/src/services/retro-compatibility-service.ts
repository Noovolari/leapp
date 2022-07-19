import { serialize } from "class-transformer";
import { Workspace } from "../models/workspace";
import { AwsSsoRoleSession } from "../models/aws/aws-sso-role-session";
import { FileService } from "./file-service";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { KeychainService } from "./keychain-service";
import { constants } from "../models/constants";
import * as uuid from "uuid";
import { SessionType } from "../models/session-type";
import { Repository } from "./repository";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";
import { Session } from "../models/session";
import { AzureSession } from "../models/azure/azure-session";
import { AzureIntegration } from "../models/azure/azure-integration";

export class RetroCompatibilityService {
  constructor(
    private fileService: FileService,
    private keyChainService: KeychainService,
    private repository: Repository,
    private behaviouralSubjectService: BehaviouralSubjectService
  ) {}

  async applyWorkspaceMigrations(): Promise<void> {
    if (this.fileService.existsSync(this.lockFilePath)) {
      if (this.isRetroPatchNecessary()) {
        await this.adaptOldWorkspaceFile();
      }
      if (this.isIntegrationPatchNecessary()) {
        await this.adaptIntegrationPatch();
      }
      this.migration1();
    }
  }

  private isRetroPatchNecessary(): boolean {
    const workspaceParsed = this.getWorkspace();
    // use a never more used property to check if workspace has changed to new version
    // also check for new integration array if present or not
    return workspaceParsed.defaultWorkspace === "default";
  }

  private async adaptOldWorkspaceFile(): Promise<Workspace> {
    // We need to adapt Sessions, IdpUrls, AwsSso Config, Proxy Config
    const workspace: any = {
      _sessions: [],
      _defaultRegion: constants.defaultRegion,
      _defaultLocation: constants.defaultLocation,
      _idpUrls: [],
      _profiles: [{ id: uuid.v4(), name: constants.defaultAwsProfileName }],
      _awsSsoIntegrations: [],
      _azureIntegrations: [],
      _proxyConfiguration: {
        proxyProtocol: "https",
        proxyUrl: undefined,
        proxyPort: "8080",
        username: undefined,
        password: undefined,
      },
    };
    const oldWorkspace = this.getWorkspace();

    // if there are no sessions, remove it, is useless, and let Leapp generate a fresh one
    if (oldWorkspace.workspaces.length === 0 || oldWorkspace.workspaces[0].sessions.length === 0) {
      // Just persist a fresh workspace data
      const freshWorkspace = new Workspace();
      this.persists(freshWorkspace);
      // Apply sessions to behaviour subject
      this.behaviouralSubjectService.sessions = freshWorkspace.sessions;
      return freshWorkspace;
    } else {
      // Adapt idp urls
      workspace._idpUrls = oldWorkspace.workspaces[0].idpUrl;
      // Adapt proxy config
      workspace._proxyConfiguration = oldWorkspace.workspaces[0].proxyConfiguration;
      // Adapt general properties
      workspace._defaultRegion = oldWorkspace.workspaces[0].defaultRegion;
      workspace._defaultLocation = oldWorkspace.workspaces[0].defaultLocation;

      await this.adaptAwsSsoConfig(oldWorkspace, workspace);
      //await this.adaptSessions(oldWorkspace, workspace);
      // Persist adapted workspace data
      this.persistsTemp(workspace);
      // Apply sessions to behaviour subject
      this.behaviouralSubjectService.sessions = workspace._sessions;
    }
  }

  private async adaptAwsSsoConfig(oldWorkspace: any, workspace: any): Promise<void> {
    const sessions = oldWorkspace.workspaces[0].sessions;
    // check if we have at least one SSO sessions
    // otherwise standard generated properties are just fine
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      // We have changed the enum type so we must check it manually
      if (session.account.type === "aws_sso" || session.account.type === "AWS_SSO") {
        // OK, let's check if we have data saved in the keychain
        let region;
        let portalUrl;
        let expirationTime;
        let browserOpening;
        try {
          region = await this.keyChainService.getSecret(constants.appName, "AWS_SSO_REGION");
          portalUrl = await this.keyChainService.getSecret(constants.appName, "AWS_SSO_PORTAL_URL");
          expirationTime = await this.keyChainService.getSecret(constants.appName, "AWS_SSO_EXPIRATION_TIME");
          browserOpening = constants.inApp.toString();
        } catch (err) {
          // we need all or nothing, otherwise it means that configuration is incomplete so its better
          // to force the user to redo the process on the new fresh workspace
        }

        workspace.awsSsoConfiguration = {
          region,
          portalUrl,
          expirationTime,
          browserOpening,
        };
        break;
      }
    }
  }

  private isIntegrationPatchNecessary(): boolean {
    const workspaceParsed = this.getWorkspace();
    // check for new integration array if present or not
    return (
      !workspaceParsed._awsSsoIntegrations ||
      (workspaceParsed._awsSsoIntegrations.length === 0 && workspaceParsed._sessions.filter((s) => s.type === "awsSsoRole").length > 0)
    );
  }

  private async adaptIntegrationPatch(): Promise<Workspace> {
    const workspace = new Workspace();
    const oldWorkspace = this.getWorkspace();

    await this.adaptIntegrations(oldWorkspace, workspace);

    // Persist adapted workspace data
    this.persists(workspace);

    // Apply sessions to behaviour subject
    this.behaviouralSubjectService.sessions = workspace.sessions;
    this.repository.workspace = workspace;
    return workspace;
  }

  private async adaptIntegrations(oldWorkspace: any, workspace: Workspace) {
    if (!workspace.awsSsoIntegrations) {
      workspace.awsSsoIntegrations = [];
    }

    workspace.idpUrls = oldWorkspace._idpUrls;
    workspace.profiles = oldWorkspace._profiles;
    workspace.proxyConfiguration = oldWorkspace._proxyConfiguration;
    workspace.defaultRegion = oldWorkspace._defaultRegion;
    workspace.defaultLocation = oldWorkspace._defaultLocation;
    //await this.adaptNewSessions(oldWorkspace, workspace);

    // Get AWS SSO Configuration from both intermediate and old configs
    const awsSsoConfiguration = oldWorkspace._awsSsoConfiguration || oldWorkspace.awsSsoConfiguration;

    if (workspace.sessions.filter((sess) => sess.type === SessionType.awsSsoRole.toString()).length > 0) {
      if (workspace.awsSsoIntegrations.length === 0) {
        workspace.awsSsoIntegrations.push(
          new AwsSsoIntegration(
            uuid.v4(),
            "Aws Single Sign-On",
            awsSsoConfiguration.portalUrl,
            awsSsoConfiguration.region,
            constants.inApp,
            awsSsoConfiguration.expirationTime
          )
        );

        try {
          const accessToken = await this.keyChainService.getSecret(constants.appName, `aws-sso-access-token`);
          await this.keyChainService.saveSecret(
            constants.appName,
            `aws-sso-integration-access-token-${workspace.awsSsoIntegrations[0].id}`,
            accessToken
          );
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

  private get lockFilePath(): string {
    return this.fileService.homeDir() + "/" + constants.lockFileDestination;
  }

  private migration1(): void {
    const workspace = this.getWorkspace();
    const isTheFirstMigration = workspace._workspaceVersion === undefined;
    if (!isTheFirstMigration) {
      return;
    }

    workspace._workspaceVersion = 1;
    const awsSsoIntegrations = workspace._awsSsoIntegrations;
    const newAwsSsoIntegrations: AwsSsoIntegration[] = [];
    if (awsSsoIntegrations && awsSsoIntegrations.length > 0) {
      for (let i = 0; i < awsSsoIntegrations.length; i++) {
        let newAwsSsoIntegration: AwsSsoIntegration;

        if (awsSsoIntegrations[i].isOnline === undefined) {
          newAwsSsoIntegration = new AwsSsoIntegration(
            awsSsoIntegrations[i].id,
            awsSsoIntegrations[i].alias,
            awsSsoIntegrations[i].portalUrl,
            awsSsoIntegrations[i].region,
            awsSsoIntegrations[i].browserOpening,
            awsSsoIntegrations[i].accessTokenExpiration
          );
        } else {
          newAwsSsoIntegration = awsSsoIntegrations[i];
        }

        newAwsSsoIntegrations.push(newAwsSsoIntegration);
      }
    }
    workspace._awsSsoIntegrations = newAwsSsoIntegrations;
    workspace._azureIntegrations = workspace._azureIntegrations || [];
    const azureSessions = workspace._sessions.filter((sess: Session) => sess.type === SessionType.azure);
    workspace._sessions = workspace._sessions.filter((sess: Session) => sess.type !== SessionType.azure);
    const defaultLocation = workspace.defaultLocation;
    const possibleNewIntegrations: AzureIntegration[] = [];
    azureSessions.forEach((sess: AzureSession) => {
      if (possibleNewIntegrations.map((ai) => ai.tenantId).indexOf(sess.tenantId) < 0) {
        // A new integration for Azure is found: add it to the list
        possibleNewIntegrations.push(
          new AzureIntegration(uuid.v4(), `AzureIntgr-${possibleNewIntegrations.length + 1}`, sess.tenantId, defaultLocation)
        );
      }
    });
    workspace._azureIntegrations = workspace._azureIntegrations.concat(possibleNewIntegrations);
    this.persists(workspace);
    this.repository.reloadWorkspace();
    const updatedAwsSsoIntegrations = this.repository.listAwsSsoIntegrations();
    const updatedAzureIntegrations = this.repository.listAzureIntegrations();
    this.behaviouralSubjectService.setIntegrations([...updatedAwsSsoIntegrations, ...updatedAzureIntegrations]);
  }

  private getWorkspace(): any {
    const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.lockFilePath));
    return JSON.parse(workspaceJSON);
  }

  private persistsTemp(workspace: any): void {
    this.fileService.writeFileSync(this.lockFilePath, this.fileService.encryptText(JSON.stringify(workspace)));
  }

  private persists(workspace: Workspace): void {
    this.fileService.writeFileSync(this.lockFilePath, this.fileService.encryptText(serialize(workspace)));
  }
}
