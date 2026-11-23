import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { BsModalService } from "ngx-bootstrap/modal";
import { constants } from "@noovolari/leapp-core/models/constants";
import { UpdaterService } from "./updater.service";
import { UpdateDialogComponent } from "../components/dialogs/update-dialog/update-dialog.component";
import { AppNativeService } from "./app-native.service";
import { WindowService } from "./window.service";
import { AppProviderService } from "./app-provider.service";

// The restored update check of the renderer, against a fake filesystem (temp HOME), a fake IPC,
// a recording modal service and a fake HTTP backend for the release notes.

const CHANGELOG_URL = "https://asset.noovolari.com/CHANGELOG.md";

class FakeFs {
  files = new Map<string, string>();
  dirs = new Set<string>();
  unreadable = new Set<string>();

  existsSync(path: string): boolean {
    return this.files.has(path) || this.dirs.has(path);
  }
  mkdirSync(path: string): void {
    this.dirs.add(path);
  }
  readFileSync(path: string): string {
    if (this.unreadable.has(path) || !this.files.has(path)) {
      throw new Error(`ENOENT: ${path}`);
    }
    return this.files.get(path);
  }
  writeFileSync(path: string, data: string): void {
    this.unreadable.delete(path);
    this.files.set(path, data);
  }
}

class FakeIpc {
  listeners = new Map<string, ((event: any, payload: any) => void)[]>();
  on(channel: string, listener: (event: any, payload: any) => void): void {
    this.listeners.set(channel, [...(this.listeners.get(channel) ?? []), listener]);
  }
  emit(channel: string, payload: any): void {
    (this.listeners.get(channel) ?? []).forEach((listener) => listener({}, payload));
  }
}

class RecordingModalService {
  shown: { component: any; config: any }[] = [];
  show(component: any, config: any): any {
    this.shown.push({ component, config });
    return { hide: () => {} };
  }
  getModalsCount(): number {
    return 0;
  }
  hide(): void {}
}

describe("UpdaterService", () => {
  let fs: FakeFs;
  let ipc: FakeIpc;
  let modals: RecordingModalService;
  let openedUrls: string[];
  let shownWindows: number;
  let http: HttpTestingController;
  let service: UpdaterService;
  let savedFlavor: string;
  let appVersion: string;

  const home = "/home/qa";
  const prodFile = "/home/qa/.Leapp/.latest.json";
  const devFile = "/home/qa/.Leapp-dev/.latest.json";
  const update = { version: "1.1.0", releaseName: "1.1.0", releaseDate: "2026-12-01T10:00:00.000Z" };

  const answerNotes = (body: string): void => {
    http.expectOne(CHANGELOG_URL).flush(body);
  };
  const failNotes = (): void => {
    http.expectOne(CHANGELOG_URL).flush("gone", { status: 404, statusText: "Not Found" });
  };
  const receive = async (info: any, notes: (() => void) | undefined = () => answerNotes("# 1.1.0\n\n- fixes")): Promise<void> => {
    const handled = service.handleUpdateAvailable(info);
    if (notes) {
      notes();
    }
    await handled;
  };

  beforeEach(() => {
    savedFlavor = process.env.LEAPP_FLAVOR;
    delete process.env.LEAPP_FLAVOR;
    fs = new FakeFs();
    ipc = new FakeIpc();
    modals = new RecordingModalService();
    openedUrls = [];
    shownWindows = 0;
    appVersion = "1.0.0";
    const native = {
      fs,
      os: { homedir: () => home },
      ipcRenderer: ipc,
      app: { getVersion: () => appVersion },
    };
    const windowService = {
      openExternalUrl: (url: string) => openedUrls.push(url),
      getCurrentWindow: () => ({ show: () => shownWindows++ }),
    };
    const sessions: any[] = [];
    const provider = {
      behaviouralSubjectService: { sessions },
      sessionManagementService: { updateSessions: () => {} },
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppNativeService, useValue: native },
        { provide: WindowService, useValue: windowService },
        { provide: AppProviderService, useValue: provider },
        { provide: BsModalService, useValue: modals },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UpdaterService);
  });

  afterEach(() => {
    http.verify();
    if (savedFlavor === undefined) {
      delete process.env.LEAPP_FLAVOR;
    } else {
      process.env.LEAPP_FLAVOR = savedFlavor;
    }
  });

  describe(".latest.json at startup", () => {
    it("an older saved version is raised to the app version", () => {
      fs.writeFileSync(prodFile, "0.20.0");
      service.start();
      expect(fs.files.get(prodFile)).toBe("1.0.0");
    });

    it("a newer saved version is left unchanged", () => {
      fs.writeFileSync(prodFile, "1.1.0");
      service.start();
      expect(fs.files.get(prodFile)).toBe("1.1.0");
    });

    it("a missing file is created with the app version", () => {
      service.start();
      expect(fs.files.get(prodFile)).toBe("1.0.0");
    });

    it("an unreadable file is rewritten with the app version", () => {
      fs.files.set(prodFile, "garbage");
      fs.unreadable.add(prodFile);
      service.start();
      expect(fs.files.get(prodFile)).toBe("1.0.0");
    });

    it("the dev flavor keeps its .latest.json in ~/.Leapp-dev and never touches ~/.Leapp", () => {
      process.env.LEAPP_FLAVOR = "dev";
      service.start();
      expect(fs.files.get(devFile)).toBe("1.0.0");
      expect(fs.files.has(prodFile)).toBe(false);
    });
  });

  describe("an update arrives", () => {
    beforeEach(() => {
      fs.writeFileSync(prodFile, "1.0.0");
      service.start();
    });

    it("UPDATE_AVAILABLE from the main process opens the update dialog with version, date and notes", async () => {
      ipc.emit("UPDATE_AVAILABLE", update);
      answerNotes("# 1.1.0\n\n- fixes");
      await new Promise((resolve) => setTimeout(resolve));

      expect(modals.shown.length).toBe(1);
      expect(modals.shown[0].component).toBe(UpdateDialogComponent);
      expect(modals.shown[0].config.initialState.version).toBe("1.1.0");
      expect(modals.shown[0].config.initialState.releaseDate).toBe("2026-12-01T10:00:00.000Z");
      expect(modals.shown[0].config.initialState.releaseNotes).toContain("<h1>1.1.0</h1>");
      expect(shownWindows).toBe(1);
    });

    it("the update is pending, so the dot, the tray entry and the Dock badge can show it", async () => {
      expect(service.isReady()).toBe(false);
      await receive(update);
      expect(service.isReady()).toBe(true);
      expect(service.isUpdateNeeded()).toBe(true);
    });

    it("an offered version not greater than the saved one opens nothing", async () => {
      await receive({ ...update, version: "1.0.0" });
      expect(modals.shown.length).toBe(0);
      expect(service.isUpdateNeeded()).toBe(false);
    });
  });

  describe("the user answers the dialog", () => {
    beforeEach(async () => {
      fs.writeFileSync(prodFile, "1.0.0");
      service.start();
      await receive(update);
    });

    it("Remind me later or × acknowledges the version: .latest.json holds it and nothing is pending", () => {
      modals.shown[0].config.initialState.callback(constants.confirmClosedAndIgnoreUpdate);
      expect(fs.files.get(prodFile)).toBe("1.1.0");
      expect(service.isUpdateNeeded()).toBe(false);
    });

    it("after acknowledging, the same version opens nothing and a newer one opens the dialog", async () => {
      modals.shown[0].config.initialState.callback(constants.confirmClosedAndIgnoreUpdate);
      await receive(update);
      expect(modals.shown.length).toBe(1);

      await receive({ ...update, version: "1.1.1" });
      expect(modals.shown.length).toBe(2);
      expect(modals.shown[1].config.initialState.version).toBe("1.1.1");
    });

    it("Download Update opens the releases page and leaves .latest.json unchanged", () => {
      modals.shown[0].config.initialState.callback(constants.confirmCloseAndDownloadUpdate);
      expect(openedUrls).toEqual(["https://leapp.cloud/releases.html"]);
      expect(fs.files.get(prodFile)).toBe("1.0.0");
    });
  });

  describe("one dialog at a time, notes that fail", () => {
    beforeEach(() => {
      fs.writeFileSync(prodFile, "1.0.0");
      service.start();
    });

    it("a second UPDATE_AVAILABLE while the dialog is open opens no second dialog", async () => {
      await receive(update);
      await receive({ ...update, version: "1.1.1" });
      expect(modals.shown.length).toBe(1);
    });

    it("when the release notes can't be downloaded the dialog opens with empty notes", async () => {
      await receive(update, failNotes);
      expect(modals.shown.length).toBe(1);
      expect(modals.shown[0].config.initialState.releaseNotes).toBe("");
    });

    it("the release notes are empty when the download fails", async () => {
      const notes = service.getReleaseNotes();
      failNotes();
      expect(await notes).toBe("");
    });
  });

  describe("release notes are rendered without raw HTML", () => {
    const hostile = '# Title\n\n<img src=x onerror="window.pwned=1">\n\n[link](javascript:window.pwned=1)\n';

    it("Markdown becomes HTML, raw HTML stays text and javascript: links are not links", async () => {
      const notes = service.getReleaseNotes();
      answerNotes(hostile);
      const html = await notes;

      const container = document.createElement("div");
      container.innerHTML = html;
      expect(container.querySelector("h1")?.textContent).toBe("Title");
      expect(container.querySelector("img")).toBeNull();
      expect(Array.from(container.querySelectorAll("a")).filter((a) => a.getAttribute("href")?.startsWith("javascript:"))).toEqual([]);
      expect((window as any).pwned).toBeUndefined();
    });
  });
});
