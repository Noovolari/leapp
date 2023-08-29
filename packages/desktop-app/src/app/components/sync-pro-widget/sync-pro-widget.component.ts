import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { AppProviderService } from "../../services/app-provider.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { OptionsDialogComponent } from "../dialogs/options-dialog/options-dialog.component";
import { WorkspaceState } from "../../services/team-service";

@Component({
  selector: "app-sync-pro-widget",
  templateUrl: "./sync-pro-widget.component.html",
  styleUrls: ["./sync-pro-widget.component.scss"],
})
export class SyncProWidgetComponent implements OnInit, OnDestroy {
  isLoggedAsPro = false;
  isFailed = false;
  isProgress = false;

  private subscription: Subscription;

  constructor(private appProviderService: AppProviderService, private bsModalService: BsModalService) {}

  ngOnInit(): void {
    this.isLoggedAsPro = false;
    this.subscription = this.appProviderService.teamService.workspacesState.subscribe((workspacesState: WorkspaceState[]) => {
      const workspaceState = workspacesState.find((wState) => wState.type === "pro");
      this.isLoggedAsPro = !!workspaceState;
      this.isProgress = workspaceState?.syncState === "in-progress";
      this.isFailed = workspaceState?.syncState === "failed";
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goToUpgrade(): void {
    this.bsModalService.show(OptionsDialogComponent, { animated: false, class: "option-modal", initialState: { selectedIndex: 6 } });
  }

  // TODO: is it still used?
  resyncAll(): void {
    this.appProviderService.teamService.pullFromRemote();
  }
}
