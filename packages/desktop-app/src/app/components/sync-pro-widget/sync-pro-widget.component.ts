import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { AppProviderService } from "../../services/app-provider.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { globalLeappProPlanStatus, LeappPlanStatus, OptionsDialogComponent } from "../dialogs/options-dialog/options-dialog.component";
import { WorkspaceState } from "../../services/team-service";
import { Role } from "../../leapp-team-core/user/role";
import { Router } from "@angular/router";
import { LoginWorkspaceDialogComponent } from "../dialogs/login-team-dialog/login-workspace-dialog.component";

@Component({
  selector: "app-sync-pro-widget",
  templateUrl: "./sync-pro-widget.component.html",
  styleUrls: ["./sync-pro-widget.component.scss"],
})
export class SyncProWidgetComponent implements OnInit, OnDestroy {
  isLoggedAsPro = false;
  isFailed = false;
  isProgress = false;
  buttonText = "UPGRADE TO PRO";

  private subscription: Subscription;
  private subscription2: Subscription;

  constructor(private appProviderService: AppProviderService, private bsModalService: BsModalService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedAsPro = false;
    this.subscription = this.appProviderService.teamService.workspacesState.subscribe(async (workspacesState: WorkspaceState[]) => {
      const workspaceState = workspacesState.find((wState) => wState.type === "pro");
      this.isLoggedAsPro = !!workspaceState;
      this.isProgress = workspaceState?.syncState === "in-progress";
      this.isFailed = workspaceState?.syncState === "failed";
      this.subscription2 = globalLeappProPlanStatus.subscribe(async (_) => {
        const currentState = await this.appProviderService.keychainService.getSecret("Leapp", "leapp-enabled-plan");
        if (currentState === LeappPlanStatus.proEnabled || currentState === LeappPlanStatus.proPending) {
          this.buttonText = "SIGN IN";
        } else {
          this.buttonText = "UPGRADE TO PRO";
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription2?.unsubscribe();
  }

  async callToAction(): Promise<void> {
    if (this.buttonText === "UPGRADE TO PRO") {
      this.bsModalService.show(OptionsDialogComponent, { animated: false, class: "option-modal", initialState: { selectedIndex: 6 } });
    } else if (this.buttonText === "SIGN IN") {
      const isLeappTeamStubbed = this.appProviderService.teamService.isLeappTeamStubbed;
      if (isLeappTeamStubbed) return;
      this.bsModalService.show(LoginWorkspaceDialogComponent, {
        animated: false,
        class: "create-modal",
        backdrop: "static",
        keyboard: false,
      });
    }
  }

  // TODO: is it still used?
  resyncAll(): void {
    this.appProviderService.teamService.pullFromRemote();
  }

  async retrySync(): Promise<void> {
    const signedInUser = this.appProviderService.teamService.signedInUserState.getValue();
    const isFirstLogin = !signedInUser.lastLogin;
    if (isFirstLogin && signedInUser.role === Role.pro) {
      try {
        await this.appProviderService.teamService.pushToRemote();
      } catch (error) {
        await this.appProviderService.teamService.setSyncState("failed");
        throw error;
      }
      await this.appProviderService.teamService.removeSessionsAndIntegrationsFromCurrentWorkspace();
      await this.appProviderService.teamService.pullFromRemote();
    } else {
      try {
        await this.appProviderService.teamService.pushToRemote();
      } catch (error) {
        await this.appProviderService.teamService.setSyncState("failed");
        throw error;
      }
    }
  }
}
