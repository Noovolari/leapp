import { ErrorStateMatcher } from "@angular/material/core";
import { FormControl, FormGroupDirective, NgForm } from "@angular/forms";

export class CrossFieldErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, _form: FormGroupDirective | NgForm | null): boolean {
    const errorsInControl = control?.errors !== null;
    const errorsInForm = control?.parent?.errors !== null;

    return (errorsInControl || errorsInForm) && ((control?.touched ?? false) || (control?.dirty ?? false));
  }
}
