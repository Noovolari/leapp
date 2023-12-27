import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { OptionsService } from "../../../services/options.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { ApiErrorCodes, FormErrorCodes, TeamService } from "../../../services/team-service";

import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { globalLeappProPlanStatus, LeappPlanStatus } from "../options-dialog/options-dialog.component";
import { AnalyticsService } from "../../../services/analytics.service";

@Component({
  selector: "app-login-team-dialog",
  templateUrl: "./login-workspace-dialog.component.html",
  styleUrls: ["./login-workspace-dialog.component.scss"],
})
export class LoginWorkspaceDialogComponent implements OnInit {
  email: FormControl;
  password: FormControl;
  signinForm: FormGroup;
  hidePassword?: boolean;
  submitting?: boolean;

  private loggingService: LogService;
  private teamService: TeamService;

  constructor(
    public appService: AppService,
    public appProviderService: AppProviderService,
    public optionsService: OptionsService,
    private analyticsService: AnalyticsService
  ) {
    this.email = new FormControl("", [Validators.required, Validators.email]);
    this.password = new FormControl("", [Validators.required]);
    this.signinForm = new FormGroup({ email: this.email, password: this.password });
    this.hidePassword = true;
    this.loggingService = appProviderService.logService;
    this.teamService = appProviderService.teamService;
    const user = this.teamService.signedInUserState.getValue();
    if (user && user.email) {
      this.email.setValue(user.email);
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
        await this.teamService.writeTouchIdCredentials(formValue.password, this.optionsService.requirePassword);
        this.appService.closeAllMenuTriggers();

        // Get the user again after login
        const userLoggedIn = await this.teamService.signedInUserState.getValue();
        this.analyticsService.init(userLoggedIn);
        await this.analyticsService.captureEvent("Sign In");

        const teamOrPro = this.teamService.workspacesState.getValue().find((wState) => wState.type === "pro" || wState.type === "team");
        const planStatus = teamOrPro.type === "team" ? LeappPlanStatus.enterprise : LeappPlanStatus.proEnabled;
        await this.appProviderService.keychainService.saveSecret("Leapp", "leapp-enabled-plan", planStatus);
        globalLeappProPlanStatus.next(planStatus);
        this.closeModal();
        if (doesWorkspaceExist) {
          await this.teamService.pullFromRemote();
        } else {
          this.loggingService.log(new LoggedEntry(`Welcome ${formValue.email}!`, this, LogLevel.success, true));
        }
      } catch (responseException: any) {
        if (responseException?.response?.data?.errorCode === ApiErrorCodes.invalidCredentials) {
          this.loggingService.log(new LoggedEntry("Invalid email or password", this, LogLevel.error, true));
          this.password.setErrors({ [FormErrorCodes.invalidCredentials]: {} });
        } else if (responseException?.response?.data?.errorCode === ApiErrorCodes.userNotActive) {
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

  ngOnInit(): void {}

  closeModal(): void {
    this.appService.closeModal();
  }
}
