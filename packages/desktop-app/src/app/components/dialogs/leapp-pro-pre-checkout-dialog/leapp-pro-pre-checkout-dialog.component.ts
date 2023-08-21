import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BsModalRef } from "ngx-bootstrap/modal";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { WindowService } from "../../../services/window.service";
import { ApiErrorCodes } from "../../../services/team-service";
import { globalLeappProPlanStatus, LeappPlanStatus } from "../options-dialog/options-dialog.component";

export enum BillingPeriod {
  yearly = "Annual subscription" as any,
  monthly = "Monthly subscription" as any,
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
  public price: any;
  private prices: any[];

  constructor(
    private bsModalRef: BsModalRef,
    private appProviderService: AppProviderService,
    private windowService: WindowService,
    private toasterService: MessageToasterService
  ) {}

  async ngOnInit(): Promise<void> {
    const tempPrices = await this.appProviderService.teamService.getPrices();
    this.prices = tempPrices.map((price) => {
      price["priceAmount"] = (parseInt(price.stripePriceAmount, 10) / 100.0).toFixed(2);
      price["monthlyPrice"] =
        price.stripePriceNickname === BillingPeriod.yearly.toString() ? (price["priceAmount"] / 12.0).toFixed(2) : price["priceAmount"];
      return price as any;
    });
    this.price = this.prices.find((price) => price.stripePriceNickname === this.selectedPeriod);
  }

  close(): void {
    this.bsModalRef.hide();
  }

  setBillingPeriod(period: BillingPeriod): void {
    this.selectedPeriod = period;
    this.price = this.prices.find((price) => price.stripePriceNickname === this.selectedPeriod);
  }

  async upgradeToLeappPro(): Promise<void> {
    if (this.isEmailValid) {
      let checkoutUrl = "";
      try {
        checkoutUrl = await this.appProviderService.teamService.createCheckoutSession(this.emailFormControl.value, this.price);
      } catch (error) {
        if (error.response.data?.errorCode === ApiErrorCodes.emailAlreadyTaken) {
          this.toasterService.toast("Email already taken", ToastLevel.error);
        } else {
          this.toasterService.toast("Something went wrong during pre-checkout", ToastLevel.error);
        }
        return;
      }

      try {
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
            this.appProviderService.keychainService.saveSecret("Leapp", "leapp-enabled-plan", LeappPlanStatus.proPending.toString());
            globalLeappProPlanStatus.next(LeappPlanStatus.proPending);
            checkoutWindow.close();
            checkoutWindow = null;
            this.close();
            this.toasterService.toast("Checkout completed", ToastLevel.success);
          } else if (details.url === "https://www.leapp.cloud/cancel") {
            checkoutWindow.close();
            checkoutWindow = null;
          }

          callback({
            requestHeaders: details.requestHeaders,
            url: details.url,
          });
        });
        checkoutWindow.loadURL(checkoutUrl);
      } catch (error) {
        this.toasterService.toast("Something went wrong during checkout", ToastLevel.error);
        return;
      }
    }
  }

  checkAndConfirm(): void {
    this.emailFormControl.markAsTouched();
    this.isEmailValid = this.form.valid;
  }
}
