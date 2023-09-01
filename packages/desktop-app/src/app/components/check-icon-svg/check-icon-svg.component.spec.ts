import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CheckIconSvgComponent } from "./check-icon-svg.component";

describe("CheckIconSvgComponent", () => {
  let component: CheckIconSvgComponent;
  let fixture: ComponentFixture<CheckIconSvgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckIconSvgComponent],
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
