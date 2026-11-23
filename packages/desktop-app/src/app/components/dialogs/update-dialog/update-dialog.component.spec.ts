import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BsModalRef } from "ngx-bootstrap/modal";
import { constants } from "@noovolari/leapp-core/models/constants";
import { UpdateDialogComponent } from "./update-dialog.component";

// The update dialog: title, version and date, notes, and what each button reports.
describe("UpdateDialogComponent", () => {
  let fixture: ComponentFixture<UpdateDialogComponent>;
  let answers: string[];
  let hidden: number;

  const text = (selector: string): string => (fixture.nativeElement.querySelector(selector)?.textContent ?? "").replace(/\s+/g, " ").trim();
  const button = (label: string): HTMLElement =>
    Array.from(fixture.nativeElement.querySelectorAll("button") as NodeListOf<HTMLElement>).find((b) => b.textContent.trim() === label);

  beforeEach(async () => {
    answers = [];
    hidden = 0;
    await TestBed.configureTestingModule({
      declarations: [UpdateDialogComponent],
      providers: [{ provide: BsModalRef, useValue: { hide: () => hidden++ } }],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateDialogComponent);
    fixture.componentInstance.version = "1.1.0";
    fixture.componentInstance.releaseDate = "2026-12-01T10:00:00.000Z";
    fixture.componentInstance.releaseNotes = "<h1>1.1.0</h1><ul><li>fixes</li></ul>";
    fixture.componentInstance.callback = (answer: string) => answers.push(answer);
    fixture.detectChanges();
  });

  it("shows New version available, the version with its release date, and the notes", () => {
    expect(text(".modal-title-message span")).toBe("New version available");
    expect(text(".modal-title-message div")).toBe("1.1.0 · Dec 1, 2026");
    expect(fixture.nativeElement.querySelector(".html-content h1").textContent).toBe("1.1.0");
  });

  it("Remind me later reports the dismissal and closes the dialog", () => {
    button("Remind me later").click();
    expect(answers).toEqual([constants.confirmClosedAndIgnoreUpdate]);
    expect(hidden).toBe(1);
  });

  it("× reports the dismissal and closes the dialog", () => {
    fixture.nativeElement.querySelector(".modal-title-close a").click();
    expect(answers).toEqual([constants.confirmClosedAndIgnoreUpdate]);
    expect(hidden).toBe(1);
  });

  it("Download Update reports the download and closes the dialog", () => {
    button("Download Update").click();
    expect(answers).toEqual([constants.confirmCloseAndDownloadUpdate]);
    expect(hidden).toBe(1);
  });
});
