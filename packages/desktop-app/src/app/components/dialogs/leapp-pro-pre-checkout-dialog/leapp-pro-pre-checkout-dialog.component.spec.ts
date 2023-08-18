import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BillingPeriod, LeappProPreCheckoutDialogComponent } from "./leapp-pro-pre-checkout-dialog.component";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../../base-injectables";
import { AppProviderService } from "../../../services/app-provider.service";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import { globalLeappProPlanStatus, LeappPlanStatus } from "../options-dialog/options-dialog.component";
import { ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";

describe("LeappProPreCheckoutDialogComponent", () => {
  let component: LeappProPreCheckoutDialogComponent;
  let fixture: ComponentFixture<LeappProPreCheckoutDialogComponent>;

  beforeEach(async () => {
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
      getSegments: [],
      listAwsSsoIntegrations: [],
      listAzureIntegrations: [],
      getDefaultLocation: () => "defaultLocation",
    });
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      integrations: [],
      integrations$: { subscribe: () => {} },
      setIntegrations: (_awsSsoIntegrations: AwsSsoIntegration[]) => void {},
      getIntegrations: () => [],
    });

    const spyIntegrationFactory = jasmine.createSpyObj("IntegrationFactory", {
      getIntegrations: () => [],
    });

    const spyLeappCoreService = jasmine.createSpyObj("AppProviderService", [], {
      keychainService: { saveSecret: () => {} },
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => ["mocked-region-1", "mocked-region-2"] },
      awsSsoOidcService: { listeners: [] },
      behaviouralSubjectService: spyBehaviouralSubjectService,
      awsSsoIntegrationService: { getIntegrations: () => [] },
      azureIntegrationService: { getIntegrations: () => [] },
      integrationFactory: spyIntegrationFactory,
      teamService: {
        createCheckoutSession: () => "fakeUrl",
        getPrices: () => [
          {
            stripePriceAmount: "12000",
            stripePriceNickname: "Monthly subscription",
          },
          {
            stripePriceAmount: "120000",
            stripePriceNickname: "Annual subscription",
          },
        ],
      },
      windowService: { newWindow: (..._args) => ({ loadURL: (_str) => {} }), getCurrentWindow: () => ({ getPosition: () => [0, 0] }) },
      toasterService: { toast: (..._args) => {} },
    });

    const spyWindowService = { newWindow: (..._args) => ({ loadURL: (_str) => {} }), getCurrentWindow: () => ({ getPosition: () => [0, 0] }) };

    await TestBed.configureTestingModule({
      declarations: [LeappProPreCheckoutDialogComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
      ].concat(
        mustInjected().concat([
          { provide: WindowService, useValue: spyWindowService },
          {
            provide: AppProviderService,
            useValue: spyLeappCoreService,
          },
        ])
      ),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeappProPreCheckoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("ngOnInit - should retrieve informations about prices online and enrich data and set the prices values", async () => {
    await component.ngOnInit();
    fixture.detectChanges();
    expect((component as any).prices[0]).toEqual({
      stripePriceAmount: "12000",
      stripePriceNickname: "Monthly subscription",
      priceAmount: "120.00",
      monthlyPrice: "120.00",
    });
    expect((component as any).price).toEqual({
      stripePriceAmount: "120000",
      stripePriceNickname: "Annual subscription",
      priceAmount: "1200.00",
      monthlyPrice: "100.00",
    });
  });

  it("close - should close the modal", () => {
    const spy = spyOn((component as any).bsModalRef, "hide").and.callFake(() => null);
    (component as any).close();
    expect(spy).toHaveBeenCalled();
  });

  it("setBillingPeriod - set the values of the billing period variable and reset the current selected price", async () => {
    await component.ngOnInit();
    (component as any).setBillingPeriod(BillingPeriod.yearly);
    expect((component as any).selectedPeriod).toEqual(BillingPeriod.yearly);
    expect((component as any).price).toEqual((component as any).prices[1]);

    (component as any).setBillingPeriod(BillingPeriod.monthly);
    expect((component as any).selectedPeriod).toEqual(BillingPeriod.monthly);
    expect((component as any).price).toEqual((component as any).prices[0]);
  });

  it("checkAndConfirm - set the email parameter to the correct form value", () => {
    const spy = spyOn((component as any).emailFormControl, "markAsTouched").and.callFake(() => true);
    (component as any).checkAndConfirm();
    expect(spy).toHaveBeenCalled();
    expect((component as any).isEmailValid).toEqual(false);

    (component as any).emailFormControl.setValue("novalid");
    (component as any).checkAndConfirm();
    expect(spy).toHaveBeenCalled();
    expect((component as any).isEmailValid).toEqual(false);

    (component as any).emailFormControl.setValue("no@reply.it");
    (component as any).checkAndConfirm();
    expect(spy).toHaveBeenCalled();
    expect((component as any).isEmailValid).toEqual(true);
  });

  it("upgradeToLeappPro", async (done) => {
    /*
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
    * */
    const fakeBackendCallData = { details: {}, callback: (..._args) => {} };
    const fakeWindow = {
      webContents: {
        session: {
          webRequest: {
            onBeforeRequest: (clk) => {
              setTimeout(() => clk(fakeBackendCallData.details, fakeBackendCallData.callback), 100);
            },
          },
        },
      },
      loadURL: (_str) => {},
      close: () => {},
    };
    const spyOnLoadUrl = spyOn(fakeWindow, "loadURL").and.callThrough();
    const spyOnRequest = spyOn(fakeWindow.webContents.session.webRequest, "onBeforeRequest").and.callThrough();
    const spyOnNewWindow = spyOn((component as any).appProviderService.windowService, "newWindow").and.returnValue(fakeWindow);
    const spyOnCheckout = spyOn((component as any).appProviderService.teamService, "createCheckoutSession").and.callThrough();
    const spyOnSaveSecret = spyOn((component as any).appProviderService.keychainService, "saveSecret").and.callThrough();
    const spyOnClose = spyOn(fakeWindow, "close").and.callThrough();
    const spyOnCallback = spyOn(fakeBackendCallData, "callback").and.callThrough();

    await (component as any).upgradeToLeappPro();
    expect(spyOnNewWindow).not.toHaveBeenCalled();
    expect(spyOnRequest).not.toHaveBeenCalled();

    (component as any).isEmailValid = true;
    (component as any).emailFormControl.setValue("alex@fake.it");
    fakeBackendCallData.details = { url: "https://www.leapp.cloud/success", requestHeaders: "fake-details" };

    await (component as any).ngOnInit();
    await (component as any).upgradeToLeappPro();

    expect(spyOnCheckout).toHaveBeenCalledWith("alex@fake.it", (component as any).price);
    expect(spyOnNewWindow).toHaveBeenCalledWith("fakeUrl", true, "", 200, 50);
    expect(spyOnLoadUrl).toHaveBeenCalledWith("fakeUrl");
    setTimeout(() => {
      expect(spyOnRequest).toHaveBeenCalled();
      expect(spyOnSaveSecret).toHaveBeenCalledWith("Leapp", "leapp-enabled-plan", LeappPlanStatus.proPending.toString());
      expect(spyOnClose).toHaveBeenCalled();
      expect(globalLeappProPlanStatus.getValue()).toEqual(LeappPlanStatus.proPending);
      expect((component as any).toasterService.toast).toHaveBeenCalledWith("Checkout completed", ToastLevel.success);
      expect(spyOnCallback).toHaveBeenCalledWith({ requestHeaders: "fake-details", url: "https://www.leapp.cloud/success" });
      done();
    }, 200);
  });
});
