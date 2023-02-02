import { TestBed } from "@angular/core/testing";
import { passwordMatchValidator } from "./password-match-validator";
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from "@angular/forms";

describe("Password Match validator", () => {
  let passwdControl: FormControl;
  let confPasswdControl: FormControl;
  let validatorFn: ValidatorFn;
  let formGroup: AbstractControl;

  beforeEach(() => {
    passwdControl = new FormControl("");
    confPasswdControl = new FormControl("");
    validatorFn = passwordMatchValidator("password", "confirmPassword");
    formGroup = new FormGroup({ password: passwdControl, confirmPassword: confPasswdControl }, validatorFn);

    TestBed.configureTestingModule({});
  });

  it("Validation - fail", () => {
    passwdControl.setValue("password");
    confPasswdControl.setValue("anotherPassword");
    expect(formGroup.valid).toBeFalsy();
  });

  it("Validation - success", () => {
    passwdControl.setValue("password");
    confPasswdControl.setValue("password");
    expect(formGroup.valid).toBeTruthy();
  });
});
