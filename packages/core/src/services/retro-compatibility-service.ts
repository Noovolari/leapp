import { serialize } from "class-transformer";
import { Workspace } from "../models/workspace";
import { AwsSsoRoleSession } from "../models/aws/aws-sso-role-session";
import { FileService } from "./file-service";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { constants } from "../models/constants";
import * as uuid from "uuid";
import { SessionType } from "../models/session-type";
import { Repository } from "./repository";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";
import { Session } from "../models/session";
import { AzureSession } from "../models/azure/azure-session";
import { AzureIntegration } from "../models/azure/azure-integration";
import { IKeychainService } from "../interfaces/i-keychain-service";
import { IntegrationType } from "../models/integration-type";
import { LeappNotification } from "../models/notification";

export class RetroCompatibilityService {
  constructor(
    private fileService: FileService,
    private keyChainService: IKeychainService,
    private repository: Repository,
    private behaviouralSubjectService: BehaviouralSubjectService
  ) {}

  /* TODO: refactor and call this method only inside WorkspaceConsistencyService's getWorkspace: in this way
      we don't need to use fileService and behaviouralSubjectService anymore because the conversion is
      done BEFORE workspace is read and returned to the rest of the app and so it can be done "in memory"
      without persistence and without notifying anything!
   */
  async applyWorkspaceMigrations(): Promise<void> {
    if (this.fileService.existsSync(this.lockFilePath)) {
      await this.migration0();
      this.migration1();
      this.migration2();
      this.migration3();
      this.migration4();
      this.migration5();
      this.migration6();
      this.migration7();
      // When adding new migrations remember to increase constants.workspaceLastVersion
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

  private async integrationTypeEnumPatch(): Promise<void> {
    const workspace = this.getWorkspace();
    const integrations = [
      ...(workspace._awsSsoIntegrations ? workspace._awsSsoIntegrations : []),
      ...(workspace._azureIntegrations ? workspace._azureIntegrations : []),
    ];
    const awsIntegrations = [];
    const azureIntegrations = [];

    for (const integration of integrations) {
      if (integration.type === "awsSso" || !integration.type) {
        integration.type = IntegrationType.awsSso;
        awsIntegrations.push(integration);
      } else if (integration.type === "azure") {
        integration.type = IntegrationType.azure;
        azureIntegrations.push(integration);
      } else if (integration.type === IntegrationType.awsSso) {
        awsIntegrations.push(integration);
      } else if (integration.type === IntegrationType.azure) {
        azureIntegrations.push(integration);
      }
    }
    workspace._awsSsoIntegrations = awsIntegrations;
    workspace._azureIntegrations = azureIntegrations;
    this.reloadIntegrations(workspace);
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
        } catch (_) {
          console.log("no need to save access token");
        }
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

  private async migration0() {
    if (this.isIntegrationPatchNecessary()) {
      await this.adaptIntegrationPatch();
    }
    await this.integrationTypeEnumPatch();
  }

  private checkMigration(workspace: any, previousVersion: number, currentVersion: number): boolean {
    const isMigrationNeeded = workspace._workspaceVersion === previousVersion;
    if (!isMigrationNeeded) {
      return false;
    }
    workspace._workspaceVersion = currentVersion;
    return true;
  }

  private migration1(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, undefined, 1)) {
      return;
    }

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
    this.reloadIntegrations(workspace);
  }

  private reloadIntegrations(workspace) {
    this.persists(workspace);
    this.repository.reloadWorkspace();
    const updatedAwsSsoIntegrations = this.repository.listAwsSsoIntegrations();
    const updatedAzureIntegrations = this.repository.listAzureIntegrations();
    this.behaviouralSubjectService.setIntegrations([...updatedAwsSsoIntegrations, ...updatedAzureIntegrations]);
  }

  private migration2(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, 1, 2)) {
      return;
    }

    workspace._pluginsStatus = [];
    this.persists(workspace);
    this.repository.reloadWorkspace();
  }

  private migration3(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, 2, 3)) {
      return;
    }

    workspace.ssmRegionBehaviour = constants.ssmRegionNo;
    this.persists(workspace);
    this.repository.reloadWorkspace();
  }

  private migration4(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, 3, 4)) {
      return;
    }

    workspace.notifications = [];
    this.persists(workspace);
    this.repository.reloadWorkspace();
  }

  private migration5(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, 4, 5)) {
      return;
    }

    const leappNotifications = this.repository.getNotifications();
    leappNotifications.forEach((notification: LeappNotification) => {
      notification.popup = notification.uuid === "uuid";
    });
    workspace.notifications = leappNotifications;
    this.persists(workspace);
    this.repository.reloadWorkspace();
  }

  private migration6(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, 5, 6)) {
      return;
    }

    workspace.requirePassword = constants.requirePasswordEveryTwoWeeks.value;
    workspace.touchIdEnabled = constants.touchIdEnabled;
    this.persists(workspace);
    this.repository.reloadWorkspace();
  }

  private migration7(): void {
    const workspace = this.getWorkspace();
    if (!this.checkMigration(workspace, 6, 7)) {
      return;
    }

    workspace.remoteWorkspacesSettingsMap = {};
    this.persists(workspace);
    this.repository.reloadWorkspace();
  }

  private getWorkspace(): any {
    const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.lockFilePath));
    return JSON.parse(workspaceJSON);
  }

  private persists(workspace: Workspace): void {
    this.fileService.writeFileSync(this.lockFilePath, this.fileService.encryptText(serialize(workspace)));
  }
}
