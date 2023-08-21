import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { LoginWorkspaceDialogComponent } from "../login-team-dialog/login-workspace-dialog.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { globalFilteredSessions, globalHasFilter, globalResetFilter } from "../../command-bar/command-bar.component";
import { sidebarHighlight } from "../../side-bar/side-bar.component";
import { User } from "../../../services/team-service";

@Component({
  selector: "app-manage-team-workspaces-dialog",
  templateUrl: "./manage-team-workspaces-dialog.component.html",
  styleUrls: ["./manage-team-workspaces-dialog.component.scss"],
})
export class ManageTeamWorkspacesDialogComponent implements OnInit {
  localWorkspaceName: string;
  loggedUser: User;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private userSubscription;

  constructor(private appProviderService: AppProviderService, public appService: AppService, private bsModalService: BsModalService) {
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.loggedUser = null;
    this.localWorkspaceName = constants.localWorkspaceName;
  }

  get doesRemoteWorkspaceExist(): boolean {
    return !!this.loggedUser;
  }

  get isWorkspaceLocked(): boolean {
    return !this.loggedUser?.accessToken;
  }

  ngOnInit(): void {
    this.userSubscription = this.appProviderService.teamService.signedInUserState.subscribe((user: User) => (this.loggedUser = user));
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  async syncWorkspace(): Promise<void> {
    try {
      this.closeModal();
      //await this.appProviderService.teamService.syncSecrets();
      await this.switchToRemoteWorkspace();
    } catch (error) {
      this.appProviderService.logService.log(new LoggedEntry(error.message, this, LogLevel.error, true));
    }
  }

  async signOutFromWorkspace(): Promise<void> {
    try {
      await this.appProviderService.teamService.signOut();
    } catch (error) {
      this.appProviderService.logService.log(new LoggedEntry(error.message, this, LogLevel.error, true));
    }
  }

  async switchToRemoteWorkspace(): Promise<void> {
    if (this.isWorkspaceLocked) {
      await this.loginToWorkspace();
    } else {
      await this.appProviderService.teamService.syncSecrets();
      this.resetFilters();
    }
  }

  async loginToWorkspace(): Promise<void> {
    this.bsModalService.show(LoginWorkspaceDialogComponent, {
      animated: false,
      class: "create-modal",
      backdrop: "static",
      keyboard: false,
    });
  }

  resetFilters(): void {
    document.querySelector(".sessions").classList.remove("filtered");
    sidebarHighlight.next({ showAll: true, showPinned: false, selectedSegment: -1 });
    globalFilteredSessions.next(this.behaviouralSubjectService.sessions);
    globalHasFilter.next(false);
    globalResetFilter.next(true);
  }
}
