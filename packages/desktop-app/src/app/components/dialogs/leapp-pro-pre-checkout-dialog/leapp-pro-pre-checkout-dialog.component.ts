import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BsModalRef } from "ngx-bootstrap/modal";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { WindowService } from "../../../services/window.service";
import { ApiErrorCodes } from "../../../services/team-service";

enum BillingPeriod {
  yearly,
  monthly,
}

@Component({
  selector: "app-leapp-pro-pre-checkout-dialog",
  templateUrl: "./leapp-pro-pre-checkout-dialog.component.html",
  styleUrls: ["./leapp-pro-pre-checkout-dialog.component.scss"],
})
export class LeappProPreCheckoutDialogComponent implements OnInit {
  public eBillingPeriod = BillingPeriod;

  public emailFormControl = new FormControl("", [Validators.required, Validators.email]);
  public planFormControl = new FormControl("annually");

  public form = new FormGroup({
    email: this.emailFormControl,
    plan: this.planFormControl,
  });

  public selectedPeriod: BillingPeriod = BillingPeriod.yearly;
  public isEmailValid = false;

  constructor(
    private bsModalRef: BsModalRef,
    private appProviderService: AppProviderService,
    private windowService: WindowService,
    private toasterService: MessageToasterService
  ) {}

  ngOnInit(): void {}

  close(): void {
    this.bsModalRef.hide();
  }

  setBillingPeriod(period: BillingPeriod) {
    this.selectedPeriod = period;
  }

  async upgradeToLeappPro(): Promise<void> {
    if (this.isEmailValid) {
      let checkoutUrl = "";
      try {
        checkoutUrl = await this.appProviderService.teamService.createCheckoutSession(this.emailFormControl.value);
      } catch (error) {
        if (error.response.data?.errorCode === ApiErrorCodes.emailAlreadyTaken) {
          this.toasterService.toast("Email already taken", ToastLevel.error);
        } else {
          this.toasterService.toast("Something went wrong during pre-checkout", ToastLevel.error);
        }
        return;
      }

      // Get active window position for extracting new windows coordinate
      const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
      const nearX = 200;
      const nearY = 50;

      let checkoutWindow = this.appProviderService.windowService.newWindow(
        checkoutUrl,
        true,
        "",
        activeWindowPosition[0] + nearX,
        activeWindowPosition[1] + nearY
      );

      checkoutWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        console.log("Intercepted HTTP redirect call:", details.url);

        if (details.url === "https://www.leapp.cloud/success") {
          checkoutWindow.close();
          checkoutWindow = null;
          this.toasterService.toast("Checkout completed", ToastLevel.success);
        }

        // TODO: manage cancel

        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        });
      });
      checkoutWindow.loadURL(checkoutUrl);
    }
  }

  checkAndConfirm(): void {
    this.emailFormControl.markAsTouched();
    this.isEmailValid = this.form.valid;
  }
}
