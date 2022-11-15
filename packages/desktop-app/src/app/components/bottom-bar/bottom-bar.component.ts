import { Component, Input, OnInit } from "@angular/core";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { SelectedSessionActionsService } from "../../services/selected-session-actions.service";
import { OptionsService } from "../../services/options.service";
import { ExtensionWebsocketService, FetchingState } from "../../services/extension-websocket.service";

@Component({
  selector: "app-bottom-bar",
  templateUrl: "./bottom-bar.component.html",
  styleUrls: ["./bottom-bar.component.scss"],
})
export class BottomBarComponent implements OnInit {
  @Input()
  selectedSession: Session;

  @Input()
  compact: boolean;

  public eSessionType = SessionType;
  public eSessionStatus = SessionStatus;
  public isWebConsoleFetching: boolean;

  constructor(
    private selectedSessionActionsService: SelectedSessionActionsService,
    public optionsService: OptionsService,
    private extensionWebsocketService: ExtensionWebsocketService
  ) {}

  ngOnInit(): void {
    this.extensionWebsocketService.fetching$.subscribe((value) => {
      this.isWebConsoleFetching = value !== FetchingState.notFetching;
    });
  }

  get isPinned(): boolean {
    return this.selectedSessionActionsService.isPinned(this.selectedSession);
  }

  async startSession(): Promise<void> {
    await this.selectedSessionActionsService.startSession(this.selectedSession);
  }

  async stopSession(): Promise<void> {
    await this.selectedSessionActionsService.stopSession(this.selectedSession);
  }

  async openAwsWebConsole(): Promise<void> {
    if (this.optionsService.extensionEnabled && !this.isWebConsoleFetching) {
      await this.extensionWebsocketService.openWebConsoleWithExtension(this.selectedSession);
    } else {
      await this.selectedSessionActionsService.openAwsWebConsole(this.selectedSession);
    }
  }

  async changeRegionModalOpen(): Promise<void> {
    await this.selectedSessionActionsService.changeRegionModalOpen(this.selectedSession);
  }

  async changeProfileModalOpen(): Promise<void> {
    await this.selectedSessionActionsService.changeProfileModalOpen(this.selectedSession);
  }

  async ssmModalOpen(): Promise<void> {
    await this.selectedSessionActionsService.ssmModalOpen(this.selectedSession);
  }

  async editCurrentSession(): Promise<void> {
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
}
