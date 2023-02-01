import { Component, OnInit, ViewChild } from "@angular/core";
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

@Component({
  selector: "app-contextual-menu",
  templateUrl: "./contextual-menu.component.html",
  styleUrls: ["./contextual-menu.component.scss"],
})
export class ContextualMenuComponent implements OnInit {
  @ViewChild(MatMenuTrigger)
  public trigger: MatMenuTrigger;

  public eConstants = constants;
  public eSessionStatus = SessionStatus;
  public eSessionType = SessionType;
  public selectedSession: Session;
  public menuX: number;
  public menuY: number;
  public isWebConsoleFetching: boolean;

  constructor(
    public appService: AppService,
    public optionsService: OptionsService,
    public appProviderService: AppProviderService,
    private selectedSessionActionsService: SelectedSessionActionsService,
    private extensionWebsocketService: ExtensionWebsocketService
  ) {}

  ngOnInit(): void {
    this.appProviderService.behaviouralSubjectService.sessionSelections$.subscribe((sessionSelections: SessionSelectionState[]) => {
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
    });

    this.extensionWebsocketService.fetching$.subscribe((value) => {
      this.isWebConsoleFetching = value !== FetchingState.notFetching;
    });
  }

  async startSession(): Promise<void> {
    await this.selectedSessionActionsService.startSession(this.selectedSession);
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
  }
}
