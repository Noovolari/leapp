import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterMenuComponent } from "./filter-menu.component";
import { mustInjected } from "../../../base-injectables";
import { MatMenuModule } from "@angular/material/menu";

describe("FilterMenuComponent", () => {
  let component: FilterMenuComponent;
  let fixture: ComponentFixture<FilterMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterMenuComponent],
      providers: [].concat(mustInjected()),
      imports: [MatMenuModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterMenuComponent);
    component = fixture.componentInstance;
    component.data = [];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
