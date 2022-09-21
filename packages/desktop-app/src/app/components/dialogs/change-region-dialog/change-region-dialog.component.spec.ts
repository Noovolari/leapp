import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChangeRegionDialogComponent } from "./change-region-dialog.component";

describe("ChangeRegionDialogComponent", () => {
  let component: ChangeRegionDialogComponent;
  let fixture: ComponentFixture<ChangeRegionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChangeRegionDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeRegionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
