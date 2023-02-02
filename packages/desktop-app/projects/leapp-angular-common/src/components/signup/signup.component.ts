import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { UserService } from "../../user/user.service";
import { ErrorStateMatcher } from "@angular/material/core";
import { LocalizationService } from "../../localization/localization.service";
import { FormErrorService } from "../../errors/form-error.service";
import { passwordMatchValidator } from "../form/password-match-validator";
import { CrossFieldErrorMatcher } from "../form/cross-field-error-matcher";
import { ApiErrorCodes } from "../../errors/api-error-codes";
import { FormErrorCodes } from "../../errors/form-error-codes";
import { ActivatedRoute } from "@angular/router";

const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*[^A-Z0-9a-z])(?=.*[0-9])(?=.*[a-z]).*$/;

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.css", "../../../assets/forms.css"],
})
export class SignupComponent implements OnInit {
  @Output() signupEvent = new EventEmitter<void>();
  @Output() errorEvent = new EventEmitter<string | number>();

  firstName: FormControl;
  lastName: FormControl;
  teamName: FormControl;
  email: FormControl;
  password: FormControl;
  passwordConfirm: FormControl;
  signupForm: FormGroup;
  errorMatcher: ErrorStateMatcher;
  hidePassword?: boolean;
  submitting?: boolean;
  teamNameQueryParam: string | null;
  private invitationCode: string;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly localizationService: LocalizationService,
    private readonly formErrorDisplayService: FormErrorService,
    private readonly routeCalled: ActivatedRoute
  ) {
    this.firstName = new FormControl("", [Validators.required]);
    this.lastName = new FormControl("", [Validators.required]);
    this.teamName = new FormControl("", [Validators.required]);
    this.email = new FormControl("", [Validators.required, Validators.email]);
    this.password = new FormControl("", [Validators.required, Validators.minLength(12), Validators.pattern(passwordStrengthRegex)]);
    this.passwordConfirm = new FormControl("", [Validators.required, Validators.minLength(12), Validators.pattern(passwordStrengthRegex)]);

    this.signupForm = new FormGroup(
      {
        firstName: this.firstName,
        lastName: this.lastName,
        teamName: this.teamName,
        email: this.email,
        password: this.password,
        passwordConfirm: this.passwordConfirm,
      },
      passwordMatchValidator("password", "passwordConfirm")
    );

    this.errorMatcher = new CrossFieldErrorMatcher();
    this.hidePassword = true;

    this.invitationCode = "";
    this.teamNameQueryParam = null;
  }

  ngOnInit(): void {
    this.invitationCode = this.routeCalled.snapshot.queryParamMap.get("invitationCode") || "";
    this.email.setValue(this.routeCalled.snapshot.queryParamMap.get("email"));

    this.teamNameQueryParam = this.routeCalled.snapshot.queryParamMap.get("teamName");
    if (this.teamNameQueryParam) {
      this.teamName.setValue(this.teamNameQueryParam);
    }
  }

  async signUp(): Promise<void> {
    if (this.signupForm.valid) {
      this.submitting = true;
      const formValue = this.signupForm.value;
      try {
        await this.userService.signUp(
          formValue.firstName,
          formValue.lastName,
          formValue.teamName,
          formValue.email,
          formValue.password,
          this.invitationCode
        );
        await this.userService.signIn(formValue.email, formValue.password);
        this.signupEvent.emit();
      } catch (responseException: any) {
        if (responseException.error.errorCode === ApiErrorCodes.emailAlreadyTaken) {
          this.email.setErrors({ [FormErrorCodes.alreadyTaken]: {} });
        } else {
          this.errorEvent.emit(responseException.status);
        }
      } finally {
        this.submitting = false;
      }
    }
  }

  getErrorFor(control: AbstractControl): string {
    return this.formErrorDisplayService.get(control);
  }

  localize(key: string): string {
    return this.localizationService.localize(key);
  }
}
