import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { TeamService, ApiErrorCodes, FormErrorCodes } from "../../../services/team-service";

import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-login-team-dialog",
  templateUrl: "./login-team-dialog.component.html",
  styleUrls: ["./login-team-dialog.component.scss"],
})
export class LoginTeamDialogComponent implements OnInit {
  email: FormControl;
  password: FormControl;
  signinForm: FormGroup;
  hidePassword?: boolean;
  submitting?: boolean;

  private loggingService: LogService;
  private teamService: TeamService;

  constructor(public appService: AppService, public appProviderService: AppProviderService) {
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
        const doesTeamExist = !!signedInUser;
        await this.teamService.signIn(formValue.email, formValue.password);
        this.closeModal();
        if (doesTeamExist) {
          await this.teamService.syncSecrets();
        } else {
          this.loggingService.log(new LoggedEntry(`Welcome ${formValue.email}!`, this, LogLevel.success, true));
        }
      } catch (responseException: any) {
        if (responseException.error?.errorCode === ApiErrorCodes.invalidCredentials) {
          this.password.setErrors({ [FormErrorCodes.invalidCredentials]: {} });
        } else if (responseException.error?.errorCode === ApiErrorCodes.userNotActive) {
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
