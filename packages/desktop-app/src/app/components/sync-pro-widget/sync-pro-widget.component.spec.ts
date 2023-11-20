import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SyncProWidgetComponent } from "./sync-pro-widget.component";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";

describe("SyncProWidgetComponent", () => {
  let component: SyncProWidgetComponent;
  let fixture: ComponentFixture<SyncProWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SyncProWidgetComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
      ].concat(mustInjected()),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncProWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
