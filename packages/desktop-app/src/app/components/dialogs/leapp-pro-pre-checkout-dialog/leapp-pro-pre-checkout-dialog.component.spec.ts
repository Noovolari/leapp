import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LeappProPreCheckoutDialogComponent } from "./leapp-pro-pre-checkout-dialog.component";

describe("LeappProPreCheckoutDialogComponent", () => {
  let component: LeappProPreCheckoutDialogComponent;
  let fixture: ComponentFixture<LeappProPreCheckoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LeappProPreCheckoutDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeappProPreCheckoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
