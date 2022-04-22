import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ColumnDialogComponent } from "./column-dialog.component";
import { mustInjected } from "../../../../base-injectables";

describe("ColumnDialogComponent", () => {
  let component: ColumnDialogComponent;
  let fixture: ComponentFixture<ColumnDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColumnDialogComponent],
      providers: [].concat(mustInjected()),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnDialogComponent);
    component = fixture.componentInstance;
    component.eGlobalColumns = { namedProfile: false, provider: false, region: false, role: false };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
