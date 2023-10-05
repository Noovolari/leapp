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
  public isFetchingPrices = false;
  public isRedirectingToCheckout = false;

  public emailFormControl = new FormControl("", [Validators.required, Validators.email]);
  public planFormControl = new FormControl("annually");
  // public fiscalCodeFormControl = new FormControl("", [Validators.pattern(/^[A-Za-z]{6}[0-9]{2}[A-Za-z]{1}[0-9]{2}[A-Za-z]{1}[0-9]{3}[A-Za-z]{1}$/)]);

  public form = new FormGroup({
    email: this.emailFormControl,
    plan: this.planFormControl,
    // fiscalCode: this.fiscalCodeFormControl,
  });

  public selectedPeriod: BillingPeriod = BillingPeriod.yearly;
  public isEmailValid = false;
  // public isCFValid = false;
  public price: any;
  private prices: any[];

  constructor(
    private bsModalRef: BsModalRef,
    private appProviderService: AppProviderService,
    private windowService: WindowService,
    private toasterService: MessageToasterService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isFetchingPrices = true;
    const tempPrices = await this.appProviderService.teamService.getPrices();
    this.isFetchingPrices = false;
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
    if (this.isEmailValid /* && this.isCFValid*/) {
      let checkoutUrl = "";
      try {
        this.isRedirectingToCheckout = true;
        checkoutUrl = await this.appProviderService.teamService.createCheckoutSession(
          this.emailFormControl.value,
          this.price
          // this.fiscalCodeFormControl?.value
        );
        this.isRedirectingToCheckout = false;
      } catch (error) {
        if (error.response.data?.errorCode === ApiErrorCodes.emailAlreadyTaken) {
          this.toasterService.toast("Email already taken", ToastLevel.error);
        } else {
          this.toasterService.toast("Something went wrong during pre-checkout", ToastLevel.error);
        }
        this.isRedirectingToCheckout = false;
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
            this.appProviderService.keychainService.saveSecret("Leapp", "leapp-enabled-plan-email", this.emailFormControl.value);
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

  openPrivacyPolicy(): void {
    this.windowService.openExternalUrl("https://d3o59asa8udcq9.cloudfront.net/docs/Privacy_Policy_Noovolari.pdf");
  }

  openTermsAndConditions(): void {
    this.windowService.openExternalUrl("https://d3o59asa8udcq9.cloudfront.net/docs/Terms_and_conditions_SAAS.pdf");
  }

  checkAndConfirm(): void {
    this.emailFormControl.markAsTouched();
    this.isEmailValid = this.emailFormControl.valid;

    // this.fiscalCodeFormControl.markAsTouched();
    // this.isCFValid = this.fiscalCodeFormControl.valid;
  }
}
