import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { ApiErrorCodes, FormErrorCodes, TeamService } from "../../services/team-service";
import { AppService } from "../../services/app.service";
import { AppProviderService } from "../../services/app-provider.service";
import { Router } from "@angular/router";
import { globalLeappProPlanStatus, LeappPlanStatus } from "../dialogs/options-dialog/options-dialog.component";
import { constants } from "@noovolari/leapp-core/models/constants";
import { MessageToasterService, ToastLevel } from "../../services/message-toaster.service";
import { AppNativeService } from "../../services/app-native.service";
import { OptionsService } from "../../services/options.service";

@Component({
  selector: "app-lock-page",
  templateUrl: "./lock-page.component.html",
  styleUrls: ["./lock-page.component.scss"],
})
export class LockPageComponent implements OnInit {
  email: FormControl;
  password: FormControl;
  signinForm: FormGroup;
  hidePassword?: boolean;
  submitting?: boolean;
  previousRoute: string;
  initials = "";
  name = "";
  showTouchId: boolean;

  private loggingService: LogService;
  private teamService: TeamService;

  constructor(
    private appProviderService: AppProviderService,
    private router: Router,
    private appService: AppService,
    private optionService: OptionsService,
    private messageToasterService: MessageToasterService,
    private appNativeService: AppNativeService
  ) {
    this.previousRoute = this.router.getCurrentNavigation().previousNavigation.finalUrl.toString();
  }

  async ngOnInit(): Promise<void> {
    this.showTouchId = this.appService.isTouchIdAvailable() && this.optionService.touchIdEnabled;
    this.email = new FormControl("", [Validators.required, Validators.email]);
    this.password = new FormControl("", [Validators.required]);
    this.signinForm = new FormGroup({ email: this.email, password: this.password });
    this.hidePassword = true;
    this.loggingService = this.appProviderService.logService;
    this.teamService = this.appProviderService.teamService;
    const user = this.teamService.signedInUserState.getValue();
    if (user && user.email) {
      this.name = user.firstName + " " + user.lastName;
      this.initials = user.firstName[0].toUpperCase() + user.lastName[0].toUpperCase();
      this.email.setValue(user.email);
      if (this.previousRoute !== "/dashboard" && this.appService.isTouchIdAvailable() && this.optionService.touchIdEnabled) {
        this.touchId();
      }
    }
  }

  async signIn(): Promise<void> {
    this.signinForm.markAllAsTouched();

    if (this.signinForm.valid) {
      this.submitting = true;
      const formValue = this.signinForm.value;
      try {
        const signedInUser = await this.teamService.signedInUserState.getValue();
        const doesWorkspaceExist = !!signedInUser;
        await this.teamService.signIn(formValue.email, formValue.password);
        this.appService.closeAllMenuTriggers();
        if (doesWorkspaceExist) {
          await this.teamService.pullFromRemote();
        } else {
          this.loggingService.log(new LoggedEntry(`Welcome ${formValue.email}!`, this, LogLevel.success, true));
        }
        await this.teamService.writeTouchIdCredentials(formValue.password, this.optionService.requirePassword);
        await this.router.navigate(["/dashboard"]);
      } catch (responseException: any) {
        if (responseException?.response.data?.errorCode === ApiErrorCodes.invalidCredentials) {
          this.loggingService.log(new LoggedEntry("Invalid email or password", this, LogLevel.error, true));
          this.password.setErrors({ [FormErrorCodes.invalidCredentials]: {} });
        } else if (responseException?.response.data?.errorCode === ApiErrorCodes.userNotActive) {
          this.loggingService.log(new LoggedEntry("The user is not active", this, LogLevel.error, true));
        } else {
          this.loggingService.log(new LoggedEntry(responseException, this, LogLevel.error, true));
        }
      } finally {
        this.submitting = false;
      }
    }
  }

  getFormError(control: AbstractControl): string {
    if (control.errors?.required) {
      return "Field is required";
    }
    if (control.errors?.email) {
      return "Invalid email";
    }
    if (control.errors?.[FormErrorCodes.invalidCredentials]) {
      return "Invalid email or password";
    }
    if (control.errors) {
      return "Unknown error";
    }
    return "";
  }

  async switchToLocalWorkspace(): Promise<void> {
    await this.appProviderService.teamService.signOut();
    this.appService.closeAllMenuTriggers();
    globalLeappProPlanStatus.next(LeappPlanStatus.free);
    await this.appProviderService.keychainService.saveSecret("Leapp", "leapp-enabled-plan", LeappPlanStatus.free);
    await this.router.navigate(["/dashboard"]);
  }

  async launchTouchId(): Promise<void> {
    await this.touchId();
  }

  private async touchId(): Promise<void> {
    const isTouchIdExpired = await this.isTouchIdExpired();
    if (
      this.appService.isTouchIdAvailable() &&
      (await this.appProviderService.keychainService.getSecret(constants.appName, constants.touchIdKeychainItemName)) &&
      !isTouchIdExpired
    ) {
      try {
        await this.appService.usePromptId();
        const oldKey = this.appProviderService.fileService.aesKey;
        this.appProviderService.fileService.aesKey = this.appNativeService.machineId;
        const touchIdKeychainItem = JSON.parse(
          await this.appProviderService.keychainService.getSecret(constants.appName, constants.touchIdKeychainItemName)
        );
        const decodedSecret = this.appProviderService.fileService.decryptText(touchIdKeychainItem.encodedSecret);
        this.appProviderService.fileService.aesKey = oldKey;
        this.password.setValue(decodedSecret, { emitEvent: true });
        await this.signIn();
      } catch (err) {
        this.messageToasterService.toast(`${err.toString().replace("Error: ", "")}`, ToastLevel.warn, "Touch ID authentication");
      }
    } else {
      this.messageToasterService.toast("Touch ID not set or expired. Password is required", ToastLevel.warn, "Touch ID key error");
    }
  }

  private async isTouchIdExpired(): Promise<boolean> {
    const touchIdKechainItem = await this.appProviderService.keychainService.getSecret(constants.appName, constants.touchIdKeychainItemName);
    if (touchIdKechainItem) {
      if (JSON.parse(touchIdKechainItem).nextExpiration > new Date().getTime()) {
        return false;
      } else {
        await this.appProviderService.keychainService.deleteSecret(constants.appName, constants.touchIdKeychainItemName);
        return true;
      }
    } else {
      return true;
    }
  }
}
