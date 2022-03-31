import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LeappSelectComponent } from "./leapp-select.component";
import { mustInjected } from "../../../base-injectables";
import { NgSelectComponent, NgSelectModule } from "@ng-select/ng-select";

describe("LeappSelectComponent", () => {
  let component: LeappSelectComponent;
  let fixture: ComponentFixture<LeappSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LeappSelectComponent, NgSelectComponent],
      providers: [].concat(mustInjected()),
      imports: [NgSelectModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeappSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
