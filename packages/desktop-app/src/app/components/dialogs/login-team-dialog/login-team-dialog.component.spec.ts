import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LoginTeamDialogComponent } from "./login-team-dialog.component";

describe("LoginTeamDialogComponent", () => {
  let component: LoginTeamDialogComponent;
  let fixture: ComponentFixture<LoginTeamDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginTeamDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginTeamDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
