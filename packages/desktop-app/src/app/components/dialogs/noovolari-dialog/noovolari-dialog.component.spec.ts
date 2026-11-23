import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoovolariDialogComponent } from "./noovolari-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { OptionsService } from "../../../services/options.service";

describe("NoovolariDialogComponent", () => {
  let component: NoovolariDialogComponent;
  let fixture: ComponentFixture<NoovolariDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoovolariDialogComponent],
      providers: mustInjected().concat([{ provide: OptionsService, useValue: { colorTheme: "dark-theme" } }]),
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
