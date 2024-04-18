import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoovolariDialogComponent } from "./noovolari-dialog.component";

describe("NoovolariDialogComponent", () => {
  let component: NoovolariDialogComponent;
  let fixture: ComponentFixture<NoovolariDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoovolariDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoovolariDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
