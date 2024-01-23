import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Session } from "@noovolari/leapp-core/models/session";
import { AppService } from "../../services/app.service";
import { MatMenuTrigger } from "@angular/material/menu";
import { AppProviderService } from "../../services/app-provider.service";
import { SessionSelectionState } from "@noovolari/leapp-core/models/session-selection-state";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { constants } from "@noovolari/leapp-core/models/constants";
import { OptionsService } from "../../services/options.service";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { SelectedSessionActionsService } from "../../services/selected-session-actions.service";
import { ExtensionWebsocketService, FetchingState } from "../../services/extension-websocket.service";
import { Subscription } from "rxjs";
import { AnalyticsService } from "../../services/analytics.service";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";
import { Role } from "../../services/team-service";

@Component({
  selector: "app-contextual-menu",
  templateUrl: "./contextual-menu.component.html",
  styleUrls: ["./contextual-menu.component.scss"],
})
export class ContextualMenuComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger)
  public trigger: MatMenuTrigger;

  public eConstants = constants;
  public eSessionStatus = SessionStatus;
  public eSessionType = SessionType;
  public selectedSession: Session;
  public menuX: number;
  public menuY: number;
  public isWebConsoleFetching: boolean;
  private sessionSelectionsSubscription: Subscription;
  private fetchingSubscription: Subscription;

  constructor(
    public appService: AppService,
    public optionsService: OptionsService,
    public appProviderService: AppProviderService,
    private selectedSessionActionsService: SelectedSessionActionsService,
    private extensionWebsocketService: ExtensionWebsocketService,
    private readonly analyticsService: AnalyticsService
  ) {}

  get isLeappTeamUser(): boolean {
    const localWorkspace = this.appProviderService.teamService.workspacesState
      .getValue()
      .find((workspace) => workspace.name === constants.localWorkspaceName);
    return (
      (this.appProviderService.teamService.signedInUserState?.getValue()?.role === Role.manager ||
        this.appProviderService.teamService.signedInUserState?.getValue()?.role === Role.user) &&
      localWorkspace.selected === false
    );
  }

  ngOnInit(): void {
    this.sessionSelectionsSubscription = this.appProviderService.behaviouralSubjectService.sessionSelections$.subscribe(
      (sessionSelections: SessionSelectionState[]) => {
        if (sessionSelections.length === 0) {
          return;
        }

        this.appService.closeAllMenuTriggers();
        this.selectedSession = this.appProviderService.repository.getSessionById(sessionSelections[0].sessionId);
        this.menuY = sessionSelections[0].menuY;
        this.menuX = sessionSelections[0].menuX;

        if (sessionSelections[0].isContextualMenuOpen) {
          setTimeout(() => {
            this.trigger.openMenu();
            this.appService.setMenuTrigger(this.trigger);
          }, 100);
        }
      }
    );

    this.fetchingSubscription = this.extensionWebsocketService.fetching$.subscribe((value) => {
      this.isWebConsoleFetching = value !== FetchingState.notFetching;
    });
  }

  ngOnDestroy() {
    this.sessionSelectionsSubscription?.unsubscribe();
    this.fetchingSubscription?.unsubscribe();
  }

  async startSession(): Promise<void> {
    const integrationId = (this.selectedSession as AwsSsoRoleSession).awsSsoConfigurationId;
    const integration = this.appProviderService.awsSsoIntegrationService.getIntegration(integrationId);

    await this.selectedSessionActionsService.startSession(this.selectedSession);

    if (this.selectedSession.type === SessionType.awsSsoRole && this.selectedSession.status === SessionStatus.active && !integration.isOnline) {
      await this.analyticsService.captureEvent("Integration Login", {
        integrationId: (this.selectedSession as AwsSsoRoleSession).awsSsoConfigurationId,
        integrationType: "AWS SSO",
        startedAt: new Date().toISOString(),
      });
    }
  }

  async stopSession(): Promise<void> {
    await this.selectedSessionActionsService.stopSession(this.selectedSession);
  }

  logoutFromFederatedSession(): void {
    this.selectedSessionActionsService.logoutFromFederatedSession(this.selectedSession);
  }

  createAChainedSessionFromSelectedOne(): void {
    this.selectedSessionActionsService.createAChainedSessionFromSelectedOne(this.selectedSession);
  }

  async ssmModalOpen(): Promise<void> {
    await this.selectedSessionActionsService.ssmModalOpen(this.selectedSession);
  }

  async openAwsWebConsole(): Promise<void> {
    if (this.optionsService.extensionEnabled) {
      await this.extensionWebsocketService.openWebConsoleWithExtension(this.selectedSession);
    } else {
      await this.selectedSessionActionsService.openAwsWebConsole(this.selectedSession);
    }

    await this.analyticsService.captureEvent("Web Console opened", {
      withExtension: this.optionsService.extensionEnabled,
      sessionType: this.selectedSession.type,
      sessionId: this.selectedSession.sessionId,
      startedAt: new Date().toISOString(),
    });
  }

  async editSession(): Promise<void> {
    await this.selectedSessionActionsService.editCurrentSession(this.selectedSession);
  }

  async pinSession(): Promise<void> {
    await this.selectedSessionActionsService.pinSession(this.selectedSession);
  }

  async unpinSession(): Promise<void> {
    await this.selectedSessionActionsService.unpinSession(this.selectedSession);
  }

  async deleteSession(): Promise<void> {
    await this.selectedSessionActionsService.deleteSession(this.selectedSession);
  }

  async changeRegionModalOpen(): Promise<void> {
    await this.selectedSessionActionsService.changeRegionModalOpen(this.selectedSession);
  }

  async changeProfileModalOpen(): Promise<void> {
    await this.selectedSessionActionsService.changeProfileModalOpen(this.selectedSession);
  }

  async copyCredentials(type: number): Promise<void> {
    await this.selectedSessionActionsService.copyCredentials(this.selectedSession, type);
  }

  async copyAwsWebConsoleUrl(): Promise<void> {
    await this.selectedSessionActionsService.copyAwsWebConsoleUrl(this.selectedSession);
  }

  async applyPluginAction(plugin: AwsCredentialsPlugin): Promise<void> {
    await this.selectedSessionActionsService.applyPluginAction(this.selectedSession, plugin);

    await this.analyticsService.captureEvent("Plugin started", {
      pluginName: plugin.metadata.uniqueName,
      startedAt: new Date().toISOString(),
    });
  }
}
