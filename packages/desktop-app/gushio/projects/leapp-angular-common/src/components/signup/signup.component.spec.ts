import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SignupComponent } from "./signup.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { FormErrorCodes } from "../../errors/form-error-codes";
import { HttpClientService } from "../../http/http-client.service";
import { HttpClientMock } from "leapp-team-core/test/http-client-mock";
import { RouterTestingModule } from "@angular/router/testing";
import { ApiErrorCodes } from "../../errors/api-error-codes";

describe("SignupComponent", () => {
  let httpClientMock: HttpClientMock;
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  const fillFormProperly = async () => {
    const formElement = fixture.debugElement.nativeElement.querySelector("form");
    const inputElements = formElement.querySelectorAll("input");

    const firstNameElement = inputElements[0];
    firstNameElement.value = "John";
    firstNameElement.dispatchEvent(new Event("input"));

    const lastNameElement = inputElements[1];
    lastNameElement.value = "Connor";
    lastNameElement.dispatchEvent(new Event("input"));

    const teamElement = inputElements[2];
    teamElement.value = "termi-team";
    teamElement.dispatchEvent(new Event("input"));

    const emailElement = inputElements[3];
    emailElement.value = "john.connor@sky.net";
    emailElement.dispatchEvent(new Event("input"));

    const passwordElement = inputElements[4];
    passwordElement.value = "Str0ngP4$$word!";
    passwordElement.dispatchEvent(new Event("input"));

    const passwordConfirmElement = inputElements[5];
    passwordConfirmElement.value = "Str0ngP4$$word!";
    passwordConfirmElement.dispatchEvent(new Event("input"));

    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    httpClientMock = new HttpClientMock();

    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        RouterTestingModule,
      ],
      declarations: [SignupComponent],
    })
      .overrideProvider(HttpClientService, { useValue: httpClientMock })
      .compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("Implementation - Create instance", () => {
    expect(component).toBeTruthy();
  });

  it("Validation - Form empty invalid", () => {
    expect(component.signupForm.valid).toBeFalsy();

    expect(component.firstName.valid).toBeFalsy();
    expect(component.firstName.errors?.required).toBeTruthy();

    expect(component.lastName.valid).toBeFalsy();
    expect(component.lastName.errors?.required).toBeTruthy();

    expect(component.email.valid).toBeFalsy();
    expect(component.email.errors?.required).toBeTruthy();

    expect(component.password.valid).toBeFalsy();
    expect(component.password.errors?.required).toBeTruthy();

    expect(component.passwordConfirm.valid).toBeFalsy();
    expect(component.passwordConfirm.errors?.required).toBeTruthy();
  });

  it("Validation - FirstName field validity", () => {
    const firstName = component.firstName;
    expect(firstName.valid).toBeFalsy();
    expect(firstName.errors?.required).toBeTruthy();

    firstName.setValue("Fox");
    expect(firstName.valid).toBeTruthy();
    expect(firstName.errors).toBeFalsy();
  });

  it("Validation - LastName field validity", () => {
    const lastName = component.lastName;
    expect(lastName.valid).toBeFalsy();
    expect(lastName.errors?.required).toBeTruthy();

    lastName.setValue("Mulder");
    expect(lastName.valid).toBeTruthy();
    expect(lastName.errors).toBeFalsy();
  });

  it("Validation - Email field validity", () => {
    const email = component.email;
    expect(email.valid).toBeFalsy();
    expect(email.errors?.required).toBeTruthy();

    email.setValue("invalidEmail");
    expect(email.valid).toBeFalsy();
    expect(email.errors?.email).toBeTruthy();

    email.setValue("valid@email.org");
    expect(email.valid).toBeTruthy();
    expect(email.errors).toBeFalsy();
  });

  it("Validation - Password field validity", () => {
    const password = component.password;
    expect(password.valid).toBeFalsy();
    expect(password.errors?.required).toBeTruthy();

    password.setValue("short-pass");
    expect(password.valid).toBeFalsy();
    expect(password.errors?.minlength).toBeTruthy();
    expect(password.errors?.minlength.requiredLength).toBe(12);

    password.setValue("weakpassword");
    expect(password.valid).toBeFalsy();
    expect(password.errors?.pattern).toBeTruthy();

    password.setValue("ValidP4$$w0rd");
    expect(password.valid).toBeTruthy();
    expect(password.errors).toBeFalsy();
  });

  it("Validation - PasswordConfirm field validity", () => {
    const passwordConfirm = component.passwordConfirm;
    expect(passwordConfirm.valid).toBeFalsy();
    expect(passwordConfirm.errors?.required).toBeTruthy();

    passwordConfirm.setValue("short-pass");
    expect(passwordConfirm.valid).toBeFalsy();
    expect(passwordConfirm.errors?.minlength).toBeTruthy();
    expect(passwordConfirm.errors?.minlength.requiredLength).toBe(12);

    passwordConfirm.setValue("weakpassword");
    expect(passwordConfirm.valid).toBeFalsy();
    expect(passwordConfirm.errors?.pattern).toBeTruthy();

    passwordConfirm.setValue("ValidP4$$w0rd");
    expect(passwordConfirm.valid).toBeTruthy();
    expect(passwordConfirm.errors).toBeFalsy();
  });

  it("Validation - Password and PasswordConfirm match", () => {
    const password = component.password;
    const passwordConfirm = component.passwordConfirm;
    const signupForm = component.signupForm;

    password.setValue("ValidP4$$w0rd_1");
    passwordConfirm.setValue("ValidP4$$w0rd_2");
    expect(password.valid).toBeTruthy();
    expect(password.errors).toBeFalsy();
    expect(passwordConfirm.valid).toBeTruthy();
    expect(passwordConfirm.errors).toBeFalsy();
    expect(signupForm.valid).toBeFalsy();
    expect(signupForm.errors?.[FormErrorCodes.passwordMismatch]).toBeTruthy();

    passwordConfirm.setValue("ValidP4$$w0rd_1");
    expect(signupForm.valid).toBeFalsy();
    expect(signupForm.errors?.[FormErrorCodes.passwordMismatch]).toBeFalsy();
  });

  it("Validation - form filled properly", async () => {
    await fillFormProperly();

    expect(component.firstName.value).toBe("John");
    expect(component.firstName.errors).toBeFalsy();
    expect(component.lastName.value).toBe("Connor");
    expect(component.lastName.errors).toBeFalsy();
    expect(component.teamName.value).toBe("termi-team");
    expect(component.teamName.errors).toBeFalsy();
    expect(component.email.value).toBe("john.connor@sky.net");
    expect(component.email.errors).toBeFalsy();
    expect(component.password.value).toBe("Str0ngP4$$word!");
    expect(component.password.errors).toBeFalsy();
    expect(component.passwordConfirm.value).toBe("Str0ngP4$$word!");
    expect(component.passwordConfirm.errors).toBeFalsy();
    expect(component.signupForm.valid).toBeTruthy();
  });

  it("Submit - All OK", async () => {
    const signupForm = {
      valid: true,
      value: {
        firstName: "John",
        lastName: "Connor",
        teamName: "termi-team",
        email: "email",
        password: "password",
      },
    } as any;
    const userService = {
      signUp: () => {},
      signIn: () => {},
    } as any;
    const signupEvent = {
      emit: () => {},
    } as any;
    spyOn(signupEvent, "emit").and.callThrough();
    spyOn(userService, "signIn").and.callThrough();
    spyOn(userService, "signUp").and.callThrough();
    const signupComponent = new SignupComponent(null as any, userService, null as any, null as any, null as any);
    (signupComponent as any).signupForm = signupForm;
    (signupComponent as any).signupEvent = signupEvent;
    await signupComponent.signUp();
    // expect(httpClientMock.urlCalled).toBe("http://localhost:3000/user/signin");
    // expect(httpClientMock.sentBody.firstName).toEqual("John");
    // expect(httpClientMock.sentBody.lastName).toEqual("Connor");
    // expect(httpClientMock.sentBody.teamName).toEqual("termi-team");
    // expect(httpClientMock.sentBody.clientMasterHash).toEqual("2b800eb977fa86a0e9051d3cf257d3a6f9ade6269ac0f2d281c661dd0d0b3bab");
    // expect(httpClientMock.sentBody.protectedSymmetricKey).not.toBeFalsy();
    // expect(httpClientMock.sentBody.rsaPublicKey).not.toBeFalsy();
    // expect(httpClientMock.sentBody.rsaProtectedPrivateKey).not.toBeFalsy();
    expect(userService.signUp).toHaveBeenCalledWith(
      signupForm.value.firstName,
      signupForm.value.lastName,
      signupForm.value.teamName,
      signupForm.value.email,
      signupForm.value.password,
      ""
    );
    expect(userService.signIn).toHaveBeenCalledWith(signupForm.value.email, signupForm.value.password);
    expect(signupEvent.emit).toHaveBeenCalled();
  }, 30000);

  it("Signup - error: email already taken", async () => {
    const error = {
      error: {
        errorCode: ApiErrorCodes.emailAlreadyTaken,
      },
    } as any;
    const signupForm = {
      valid: true,
      value: {
        firstName: "firstName",
        lastName: "lastName",
        teamName: "teamName",
        email: "email",
        password: "password",
      },
    } as any;
    const userService = {
      signUp: () => {},
    } as any;
    const email = {
      setErrors: () => {},
    } as any;
    spyOn(userService, "signUp").and.throwError(error);
    spyOn(email, "setErrors").and.callThrough();
    const signupComponent = new SignupComponent(null as any, userService, null as any, null as any, null as any);
    (signupComponent as any).signupForm = signupForm;
    (signupComponent as any).email = email;
    (signupComponent as any).invitationCode = "fake-code";
    await signupComponent.signUp();
    expect(email.setErrors).toHaveBeenCalled();
  });

  it("Signup - error: generic error", async () => {
    const error = {
      status: "mock-error-status",
      error: {
        errorCode: ApiErrorCodes.invalidCredentials,
      },
    } as any;
    const signupForm = {
      valid: true,
      value: {
        firstName: "firstName",
        lastName: "lastName",
        teamName: "teamName",
        email: "email",
        password: "password",
      },
    } as any;
    const userService = {
      signUp: () => {},
    } as any;
    const errorEvent = {
      emit: () => {},
    } as any;
    spyOn(userService, "signUp").and.throwError(error);
    spyOn(errorEvent, "emit").and.callThrough();
    const signupComponent = new SignupComponent(null as any, userService, null as any, null as any, null as any);
    (signupComponent as any).signupForm = signupForm;
    (signupComponent as any).errorEvent = errorEvent;
    (signupComponent as any).invitationCode = "fake-code";
    await signupComponent.signUp();
    expect(errorEvent.emit).toHaveBeenCalledWith(error.status);
  });

  it("Signup - invalid form", async () => {
    const signupForm = {
      valid: false,
    };
    const userService = {
      signUp: () => {},
    } as any;
    spyOn(userService, "signUp").and.callThrough();
    const signupComponent = new SignupComponent(null as any, userService, null as any, null as any, null as any);
    (signupComponent as any).signupForm = signupForm;
    expect(userService.signUp).not.toHaveBeenCalled();
  });

  it("ngOnInit", () => {
    const routeCalled = {
      snapshot: {
        queryParamMap: {
          get: () => "fake-param-map",
        },
      },
    } as any;
    const email = {
      setValue: () => {},
    } as any;
    const teamName = {
      setValue: () => {},
    } as any;
    spyOn(routeCalled.snapshot.queryParamMap, "get").and.callThrough();
    spyOn(teamName, "setValue").and.callThrough();
    spyOn(email, "setValue").and.callThrough();
    const signupComponent = new SignupComponent(null as any, null as any, null as any, null as any, null as any);
    (signupComponent as any).routeCalled = routeCalled;
    (signupComponent as any).email = email;
    (signupComponent as any).teamName = teamName;
    signupComponent.ngOnInit();

    expect(routeCalled.snapshot.queryParamMap.get).toHaveBeenCalledTimes(3);
    expect(email.setValue).toHaveBeenCalledWith("fake-param-map");
    expect(teamName.setValue).toHaveBeenCalledWith("fake-param-map");
  });
});
