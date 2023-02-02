import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SignInComponent } from "./sign-in.component";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { Event } from "@angular/router";
import { HttpClientService } from "../../http/http-client.service";
import { HttpClientMock } from "leapp-team-core/test/http-client-mock";
import { ApiErrorCodes } from "../../errors/api-error-codes";

describe("SigninComponent", () => {
  let httpClientMock: HttpClientMock;
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;

  const fillFormProperly = async () => {
    const formElement = fixture.debugElement.nativeElement.querySelector("form");
    const inputElements = formElement.querySelectorAll("input");

    const emailElement = inputElements[0];
    emailElement.value = "john.connor@sky.net";
    emailElement.dispatchEvent(new Event("input"));

    const passwordElement = inputElements[1];
    passwordElement.value = "Str0ngP4$$word!";
    passwordElement.dispatchEvent(new Event("input"));

    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    httpClientMock = new HttpClientMock();

    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
      ],
      declarations: [SignInComponent],
    })
      .overrideProvider(HttpClientService, { useValue: httpClientMock })
      .compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("Implementation - Create instance", () => {
    expect(component).toBeTruthy();
  });

  it("Validation - Form empty invalid", () => {
    expect(component.signinForm.valid).toBeFalsy();

    expect(component.email.valid).toBeFalsy();
    expect(component.email.errors?.required).toBeTruthy();

    expect(component.password.valid).toBeFalsy();
    expect(component.password.errors?.required).toBeTruthy();
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

    password.setValue("passwd");
    expect(password.valid).toBeTruthy();
    expect(password.errors).toBeFalsy();
  });

  it("Validation - form filled properly", async () => {
    await fillFormProperly();

    expect(component.email.value).toBe("john.connor@sky.net");
    expect(component.email.errors).toBeFalsy();
    expect(component.password.value).toBe("Str0ngP4$$word!");
    expect(component.password.errors).toBeFalsy();
    expect(component.signinForm.valid).toBeTruthy();
  });

  it("Submit - All OK", async () => {
    await fillFormProperly();

    const submitButtonElement = fixture.debugElement.nativeElement.querySelector("form > button");
    submitButtonElement.click();

    fixture.detectChanges();
    await fixture.whenStable();
    await httpClientMock.awaitNetworkCall();

    expect(httpClientMock.urlCalled).toBe("http://localhost:3000/user/signin");
    expect(httpClientMock.sentBody.email).toEqual("john.connor@sky.net");
    expect(httpClientMock.sentBody.clientMasterHash).toEqual("2b800eb977fa86a0e9051d3cf257d3a6f9ade6269ac0f2d281c661dd0d0b3bab");
  }, 30000);

  it("SignIn - error: invalidCredentials", async () => {
    const error = {
      error: {
        errorCode: ApiErrorCodes.invalidCredentials,
      },
    } as any;
    const signinForm = {
      valid: true,
      value: { email: "mock-email", password: "mock-password" },
      markAllAsTouched: jasmine.createSpy(),
    } as any;
    const userService = {
      signIn: () => {},
    } as any;
    const password = {
      setErrors: () => {},
    } as any;
    spyOn(userService, "signIn").and.throwError(error);
    spyOn(password, "setErrors").and.callThrough();
    const signinComponent = new SignInComponent(userService, null as any, null as any);
    (signinComponent as any).signinForm = signinForm;
    (signinComponent as any).password = password;
    await signinComponent.signIn();
    expect(password.setErrors).toHaveBeenCalled();
    expect(signinForm.markAllAsTouched).toHaveBeenCalledTimes(1);
  });

  it("SignIn - error: userNotActive", async () => {
    const error = {
      error: {
        errorCode: ApiErrorCodes.userNotActive,
      },
    } as any;
    const signinForm = {
      valid: true,
      value: { email: "mock-email", password: "mock-password" },
      markAllAsTouched: jasmine.createSpy(),
    } as any;
    const userService = {
      signIn: () => {},
    } as any;
    const errorEvent = {
      emit: () => {},
    } as any;
    spyOn(userService, "signIn").and.throwError(error);
    spyOn(errorEvent, "emit").and.callThrough();
    const signinComponent = new SignInComponent(userService, null as any, null as any);
    (signinComponent as any).signinForm = signinForm;
    (signinComponent as any).errorEvent = errorEvent;
    await signinComponent.signIn();
    expect(errorEvent.emit).toHaveBeenCalledWith(ApiErrorCodes.userNotActive);
    expect(signinForm.markAllAsTouched).toHaveBeenCalledTimes(1);
  });

  it("SignIn - error: generic error", async () => {
    const error = {
      error: {
        errorCode: "generic-error-code",
      },
      status: "fake-status",
    } as any;
    const signinForm = {
      valid: true,
      value: { email: "mock-email", password: "mock-password" },
      markAllAsTouched: jasmine.createSpy(),
    } as any;
    const userService = {
      signIn: () => {},
    } as any;
    const errorEvent = {
      emit: () => {},
    } as any;
    spyOn(userService, "signIn").and.throwError(error);
    spyOn(errorEvent, "emit").and.callThrough();
    const signinComponent = new SignInComponent(userService, null as any, null as any);
    (signinComponent as any).signinForm = signinForm;
    (signinComponent as any).errorEvent = errorEvent;
    await signinComponent.signIn();
    expect(errorEvent.emit).toHaveBeenCalledWith(error.status);
    expect(signinForm.markAllAsTouched).toHaveBeenCalledTimes(1);
  });

  it("SignIn - success and emit signin event", async () => {
    const mockUser = "mock-user" as any;
    const signinForm = {
      valid: true,
      value: { email: "mock-email", password: "mock-password" },
      markAllAsTouched: jasmine.createSpy(),
    } as any;
    const userService = {
      signIn: () => mockUser,
    } as any;
    const signinEvent = {
      emit: () => {},
    } as any;
    spyOn(userService, "signIn").and.callThrough();
    spyOn(signinEvent, "emit").and.callThrough();
    const signinComponent = new SignInComponent(userService, null as any, null as any);
    (signinComponent as any).signinForm = signinForm;
    await (signinComponent as any).signIn();
    expect(userService.signIn).toHaveBeenCalledWith(signinForm.value.email, signinForm.value.password);
    expect(signinForm.markAllAsTouched).toHaveBeenCalledTimes(1);
  });
});
