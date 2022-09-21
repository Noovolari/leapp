import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChangeNamedProfileDialogComponent } from "./change-named-profile-dialog.component";

describe("ChangeNamedProfileDialogComponent", () => {
  let component: ChangeNamedProfileDialogComponent;
  let fixture: ComponentFixture<ChangeNamedProfileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChangeNamedProfileDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeNamedProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
