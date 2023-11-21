import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LockPageComponent } from "./lock-page.component";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../base-injectables";
import { ActivatedRoute, Router } from "@angular/router";

describe("LockPageComponent", () => {
  let component: LockPageComponent;
  let fixture: ComponentFixture<LockPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LockPageComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              previousNavigation: { finalUrl: "" },
            }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (str) => str,
              },
            },
          },
        },
      ].concat(mustInjected()),
    }).compileComponents();

    fixture = TestBed.createComponent(LockPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();

    (component as any).appService.isTouchIdAvailable = () => true;
    (component as any).optionService = { touchIdEnabled: true };
    component.ngOnInit();
    expect((component as any).email.value).toEqual("teamMemberEmail");
    expect((component as any).name).toEqual("teamMemberFirstName teamMemberLastName");
    expect((component as any).initials).toEqual("TT");
  });
});
