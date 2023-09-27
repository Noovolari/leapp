import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LockPageComponent } from "./lock-page.component";
import { RouterTestingModule } from "@angular/router/testing";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../base-injectables";
import { Router } from "@angular/router";

describe("LoginPageComponent", () => {
  let component: LockPageComponent;
  let fixture: ComponentFixture<LockPageComponent>;

  beforeEach(async () => {
    const router = {
      getCurrentNavigation: () => ({
        previousNavigation: { finalUrl: "" },
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [LockPageComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
        { provide: Router, useValue: router },
      ].concat(mustInjected()),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LockPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
