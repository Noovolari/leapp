import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { FormErrorCodes } from "../../errors/form-error-codes";

export const passwordMatchValidator =
  (passwordField: string, confirmField: string): ValidatorFn =>
  (formGroup: AbstractControl): ValidationErrors | null =>
    formGroup.get(passwordField)?.value === formGroup.get(confirmField)?.value ? null : { [FormErrorCodes.passwordMismatch]: {} };
