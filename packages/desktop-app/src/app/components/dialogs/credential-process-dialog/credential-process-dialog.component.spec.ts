import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CredentialProcessDialogComponent } from "./credential-process-dialog.component";
import { mustInjected } from "../../../../base-injectables";

describe("CredentialProcessDialogComponent", () => {
  let component: CredentialProcessDialogComponent;
  let fixture: ComponentFixture<CredentialProcessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CredentialProcessDialogComponent],
      providers: [].concat(mustInjected()),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CredentialProcessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
