import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { AppProviderService } from "../../services/app-provider.service";
import { User } from "../../leapp-team-core/user/user";
import { BsModalService } from "ngx-bootstrap/modal";
import { OptionsDialogComponent } from "../dialogs/options-dialog/options-dialog.component";

@Component({
  selector: "app-sync-pro-widget",
  templateUrl: "./sync-pro-widget.component.html",
  styleUrls: ["./sync-pro-widget.component.scss"],
})
export class SyncProWidgetComponent implements OnInit, OnDestroy {
  isLoggedAsPro = false;
  isOpen = false;

  private subscription: Subscription;

  constructor(private appProviderService: AppProviderService, private bsModalService: BsModalService) {}

  ngOnInit(): void {
    this.isOpen = false;
    this.isLoggedAsPro = false;
    this.subscription = this.appProviderService.teamService.signedInUserState.subscribe((userState: User) => {
      this.isLoggedAsPro = userState !== null && userState?.role === "pro";
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goToUpgrade(): void {
    this.isOpen = false;
    this.bsModalService.show(OptionsDialogComponent, { animated: false, class: "option-modal", initialState: { selectedIndex: 6 } });
  }
}
