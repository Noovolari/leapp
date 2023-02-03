import { TestBed } from "@angular/core/testing";

import { FormErrorService } from "./form-error.service";
import { FormControl } from "@angular/forms";
import { FormErrorCodes } from "./form-error-codes";
import { LocalizationService } from "../localization/localization.service";

describe("FormErrorService", () => {
  let formErrorService: FormErrorService;
  const localizationServiceMock: any = {};

  beforeEach(() => {
    TestBed.configureTestingModule({}).overrideProvider(LocalizationService, { useValue: localizationServiceMock });
    formErrorService = TestBed.inject(FormErrorService);
  });

  it("Get - required field missing", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ required: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.Required");
  });

  it("Get - wrong mail address", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ email: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.Email");
  });

  it("Get - min length not satisfied", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ minlength: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.MinLength");
  });

  it("Get - regex pattern not satisfied", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ pattern: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.PasswordPattern");
  });

  it("Get - password mismatch", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ [FormErrorCodes.passwordMismatch]: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.PasswordMismatch");
  });

  it("Get - email already taken", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ [FormErrorCodes.alreadyTaken]: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.EmailAlreadyTaken");
  });

  it("Get - invalid credentials", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ [FormErrorCodes.invalidCredentials]: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.InvalidCredentials");
  });

  it("Get - unknown error", () => {
    const control: FormControl = new FormControl();
    control.setErrors({ randomError: {} });
    localizationServiceMock.localize = (str: string) => str;

    expect(formErrorService.get(control)).toEqual("error.UnknownError");
  });

  it("Get - No error present!", () => {
    const control: FormControl = new FormControl();

    expect(formErrorService.get(control)).toEqual("");
  });
});
