import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { UserService } from "../../user/user.service";
import { LocalizationService } from "../../localization/localization.service";
import { FormErrorService } from "../../errors/form-error.service";
import { ApiErrorCodes } from "../../errors/api-error-codes";
import { FormErrorCodes } from "../../errors/form-error-codes";
import { User } from "leapp-team-core/user/user";

@Component({
  selector: "app-signin",
  templateUrl: "./sign-in.component.html",
  styleUrls: ["./sign-in.component.css", "../../../assets/forms.css"],
})
export class SignInComponent implements OnInit {
  @Output() signinEvent = new EventEmitter<User>();
  @Output() errorEvent = new EventEmitter<string | number>();

  email: FormControl;
  password: FormControl;
  signinForm: FormGroup;
  hidePassword?: boolean;
  submitting?: boolean;

  constructor(
    private readonly userService: UserService,
    private readonly localizationService: LocalizationService,
    private readonly formErrorService: FormErrorService
  ) {
    this.email = new FormControl("", [Validators.required, Validators.email]);
    this.password = new FormControl("", [Validators.required]);
    this.signinForm = new FormGroup({ email: this.email, password: this.password });
    this.hidePassword = true;
  }

  ngOnInit(): void {}

  async signIn(): Promise<void> {
    this.signinForm.markAllAsTouched();

    if (this.signinForm.valid) {
      this.submitting = true;
      const formValue = this.signinForm.value;
      try {
        const user: User = await this.userService.signIn(formValue.email, formValue.password);
        this.signinEvent.emit(user);
      } catch (responseException: any) {
        if (responseException.error?.errorCode === ApiErrorCodes.invalidCredentials) {
          this.password.setErrors({ [FormErrorCodes.invalidCredentials]: {} });
        } else if (responseException.error?.errorCode === ApiErrorCodes.userNotActive) {
          this.errorEvent.emit(ApiErrorCodes.userNotActive);
        } else {
          this.errorEvent.emit(responseException.status);
        }
      } finally {
        this.submitting = false;
      }
    }
  }

  getErrorFor(control: AbstractControl): string {
    return this.formErrorService.get(control);
  }

  localize(key: string): string {
    return this.localizationService.localize(key);
  }
}
