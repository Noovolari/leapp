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

  private loggingService: LogService;
  private teamService: TeamService;
  private serviceString = "touch-id-lock-password";

  constructor(
    private router: Router,
    public appService: AppService,
    public appProviderService: AppProviderService,
    private messageToasterService: MessageToasterService
  ) {
    this.previousRoute = this.router.getCurrentNavigation().previousNavigation.finalUrl.toString();
  }

  async ngOnInit(): Promise<void> {
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
      if (this.previousRoute !== "/dashboard" && this.appService.isTouchIdAvailable()) {
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
        if (!(await this.appProviderService.keychainService.getSecret(constants.appName, this.serviceString))) {
          await this.appProviderService.keychainService.saveSecret(constants.appName, this.serviceString, formValue.password);
        }
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
    if (this.appService.isTouchIdAvailable() && (await this.appProviderService.keychainService.getSecret(constants.appName, this.serviceString))) {
      try {
        await this.appService.usePromptId();
        const encodedString = await this.appProviderService.keychainService.getSecret(constants.appName, this.serviceString);
        this.password.setValue(encodedString, { emitEvent: true });
        await this.signIn();
      } catch (err) {
        this.messageToasterService.toast(`${err.toString().replace("Error: ", "")}`, ToastLevel.warn, "Touch ID authentication");
      }
    }
  }
}
