import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SyncProWidgetComponent } from "./sync-pro-widget.component";

describe("SyncProWidgetComponent", () => {
  let component: SyncProWidgetComponent;
  let fixture: ComponentFixture<SyncProWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SyncProWidgetComponent],
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
