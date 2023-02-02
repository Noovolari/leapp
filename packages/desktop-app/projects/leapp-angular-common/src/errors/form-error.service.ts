import { Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { FormErrorCodes } from "./form-error-codes";
import { LocalizationService } from "../localization/localization.service";

@Injectable({ providedIn: "root" })
export class FormErrorService {
  constructor(private readonly localizationService: LocalizationService) {}

  get(control: AbstractControl): string {
    if (control.errors?.required) {
      return this.localizationService.localize(`error.Required`);
    }
    if (control.errors?.email) {
      return this.localizationService.localize(`error.Email`);
    }
    if (control.errors?.minlength) {
      return this.localizationService.localize(`error.MinLength`, { requiredLength: control.errors.minlength.requiredLength });
    }
    if (control.errors?.pattern) {
      return this.localizationService.localize(`error.PasswordPattern`);
    }
    if (control.errors?.[FormErrorCodes.passwordMismatch]) {
      return this.localizationService.localize(`error.PasswordMismatch`);
    }
    if (control.errors?.[FormErrorCodes.alreadyTaken]) {
      return this.localizationService.localize(`error.EmailAlreadyTaken`);
    }
    if (control.errors?.[FormErrorCodes.invalidCredentials]) {
      return this.localizationService.localize(`error.InvalidCredentials`);
    }

    if (control.errors) {
      return this.localizationService.localize(`error.UnknownError`);
    }

    return "";
  }
}
