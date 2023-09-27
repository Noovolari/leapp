import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CheckIconSvgComponent } from "./check-icon-svg.component";
import { RouterTestingModule } from "@angular/router/testing";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../base-injectables";

describe("CheckIconSvgComponent", () => {
  let component: CheckIconSvgComponent;
  let fixture: ComponentFixture<CheckIconSvgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckIconSvgComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
      ].concat(mustInjected()),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckIconSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
