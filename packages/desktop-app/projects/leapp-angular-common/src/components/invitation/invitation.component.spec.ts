import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InvitationComponent } from "./invitation.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientService } from "../../http/http-client.service";
import { HttpClientMock } from "leapp-team-core/test/http-client-mock";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("InvitationComponent", () => {
  let component: InvitationComponent;
  let fixture: ComponentFixture<InvitationComponent>;
  let httpClientMock: HttpClientMock;

  beforeEach(async () => {
    httpClientMock = new HttpClientMock();

    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        HttpClientTestingModule,
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
      declarations: [InvitationComponent],
    })
      .overrideProvider(HttpClientService, { useValue: httpClientMock })
      .compileComponents();

    fixture = TestBed.createComponent(InvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("localize - success and return a string", () => {
    const mockLocalization = "fake-localization";
    const localizationService = {
      localize: () => mockLocalization,
    } as any;
    spyOn(localizationService, "localize").and.callThrough();
    const key = "fake-key";
    component = new InvitationComponent(null as any, localizationService, null as any, null as any);
    const result = component.localize(key);
    expect(localizationService.localize).toHaveBeenCalledWith(key);
    expect(result).toEqual(mockLocalization);
  });

  it("invite - form invalid", async () => {
    const invitationform = {
      valid: false,
    } as any;
    component = new InvitationComponent(null as any, null as any, null as any, null as any);
    (component as any).invitationForm = invitationform;
    await component.invite();
    expect((component as any).submitting).toBeFalsy();
  });

  it("invite - success", async () => {
    const snackBarService = {
      showError: () => {},
      showMessage: () => {},
    };
    const invitationForm = {
      valid: true,
      value: { email: "fake-email" },
    } as any;
    const invitationService = {
      create: () => {},
    } as any;
    spyOn(invitationService, "create").and.callThrough();
    spyOn(snackBarService, "showError").and.callFake(() => {});
    spyOn(snackBarService, "showMessage").and.callFake(() => {});

    component = new InvitationComponent(null as any, null as any, invitationService, snackBarService as any);
    (component as any).invitationForm = invitationForm;
    (component as any).invitedUserRole = "fake-role";
    (component as any).inviterId = "fake-inviter-id";
    await component.invite();
    expect(invitationService.create).toHaveBeenCalledWith(invitationForm.value.email, "fake-role", "fake-inviter-id");
    expect(snackBarService.showError).toHaveBeenCalled();
  });

  it("invite - catch error", async () => {
    const error = new Error("fake-error-message");
    const invitationForm = {
      valid: true,
      value: { email: "fake-email" },
    } as any;
    const snackbarService = {
      showError: () => {},
    } as any;
    const invitationService = {
      create: () => {},
    } as any;
    spyOn(invitationService, "create").and.throwError(error);
    spyOn(snackbarService, "showError").and.callThrough();
    component = new InvitationComponent(null as any, null as any, invitationService, snackbarService);
    (component as any).invitationForm = invitationForm;
    await component.invite();
    expect(snackbarService.showError).toHaveBeenCalledWith(error.toString());
  });
});
