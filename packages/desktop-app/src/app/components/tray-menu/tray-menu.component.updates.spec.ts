import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { BsModalService } from "ngx-bootstrap/modal";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { OperatingSystem } from "@noovolari/leapp-core/models/operating-system";
import { TrayMenuComponent } from "./tray-menu.component";
import { AppService } from "../../services/app.service";
import { AppNativeService } from "../../services/app-native.service";
import { WindowService } from "../../services/window.service";
import { MessageToasterService } from "../../services/message-toaster.service";
import { AppProviderService } from "../../services/app-provider.service";
import { UpdaterService } from "../../services/updater.service";

// The tray menu: session entries and the pending update entry, with a fake Electron Menu/Tray/Dock and the real
// UpdaterService on a fake filesystem.

class FakeTray {
  static instances: FakeTray[] = [];
  menu: any;
  constructor() {
    FakeTray.instances.push(this);
  }
  setToolTip(): void {}
  setContextMenu(menu: any): void {
    this.menu = menu;
  }
}

const iamUser = (index: number, status = SessionStatus.inactive): any => ({
  sessionId: `session-${index}`,
  sessionName: `session ${index}`,
  type: SessionType.awsIamUser,
  status,
  profileId: "profile-1",
});

describe("TrayMenuComponent: sessions and updates", () => {
  let component: TrayMenuComponent;
  let sessions: any[];
  let started: string[];
  let stopped: string[];
  let badges: string[];
  let os: OperatingSystem;
  let files: Map<string, string>;
  let http: HttpTestingController;
  let updater: UpdaterService;
  let modals: any[];

  const labels = (): string[] => FakeTray.instances[FakeTray.instances.length - 1].menu.map((voice: any) => voice.label);
  const menu = (): any[] => FakeTray.instances[FakeTray.instances.length - 1].menu;

  beforeEach(() => {
    delete process.env.LEAPP_FLAVOR;
    FakeTray.instances = [];
    sessions = [];
    started = [];
    stopped = [];
    badges = [];
    modals = [];
    os = OperatingSystem.mac;
    files = new Map([["/home/qa/.Leapp/.latest.json", "1.0.0"]]);
    (window as any).__dirname = "";

    const appService = {
      getMenu: () => ({ buildFromTemplate: (template: any[]) => template, setApplicationMenu: () => {} }),
      detectOs: () => os,
      getApp: () => ({ dock: { setBadge: (badge: string) => badges.push(badge) } }),
      about: () => {},
    };
    const native = {
      tray: FakeTray,
      os: { homedir: () => "/home/qa" },
      fs: {
        existsSync: (path: string) => files.has(path),
        mkdirSync: () => {},
        readFileSync: (path: string) => {
          if (!files.has(path)) {
            throw new Error("ENOENT");
          }
          return files.get(path);
        },
        writeFileSync: (path: string, data: string) => files.set(path, data),
      },
      ipcRenderer: { on: () => {} },
      app: { getVersion: () => "1.0.0" },
    };
    const sessionService = {
      start: async (id: string) => started.push(id),
      stop: async (id: string) => stopped.push(id),
    };
    const provider = {
      behaviouralSubjectService: { sessions: [], sessions$: { subscribe: () => ({ unsubscribe: () => {} }) } },
      sessionManagementService: { getSessions: () => sessions, updateSessions: () => {} },
      namedProfileService: { getNamedProfiles: () => [{ id: "profile-1", name: "default" }] },
      sessionFactory: { getSessionService: () => sessionService },
      awsCoreService: {},
      logService: { log: () => {} },
    };

    TestBed.configureTestingModule({
      declarations: [TrayMenuComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppService, useValue: appService },
        { provide: AppNativeService, useValue: native },
        { provide: WindowService, useValue: { openExternalUrl: () => {}, getCurrentWindow: () => ({ show: () => {} }) } },
        { provide: MessageToasterService, useValue: { toast: () => {} } },
        { provide: AppProviderService, useValue: provider },
        { provide: BsModalService, useValue: { show: (c: any, config: any) => modals.push(config), getModalsCount: () => 0, hide: () => {} } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    updater = TestBed.inject(UpdaterService);
    component = TestBed.createComponent(TrayMenuComponent).componentInstance;
    // ngOnInit (not run here) subscribes to sessions$; ngOnDestroy unsubscribes at cleanup
    (component as any).subscribed = { unsubscribe: () => {} };
  });

  const offer = async (version: string): Promise<void> => {
    const handled = updater.handleUpdateAvailable({ version, releaseName: version, releaseDate: "2026-12-01T10:00:00.000Z" });
    http.expectOne("https://asset.noovolari.com/CHANGELOG.md").flush("# notes");
    await handled;
  };

  it("with more than 10 sessions the first 10 are listed and the rest go under More Sessions...", async () => {
    sessions = Array.from({ length: 12 }, (_, i) => iamUser(i + 1));
    await component.generateMenu();

    const sessionLabels = labels().filter((label) => label?.startsWith("  session"));
    expect(sessionLabels).toEqual(Array.from({ length: 10 }, (_, i) => `  session ${i + 1} - iam user`));
    const more = menu().find((voice) => voice.label === "More Sessions...");
    expect(more.submenu.map((voice: any) => voice.label)).toEqual(["  session 11 - iam user", "  session 12 - iam user"]);
  });

  it("clicking a tray entry starts an inactive session and stops an active one", async () => {
    sessions = [iamUser(1), iamUser(2, SessionStatus.active)];
    await component.generateMenu();

    await menu()[0].click();
    await menu()[1].click();
    expect(started).toEqual(["session-1"]);
    expect(stopped).toEqual(["session-2"]);
  });

  it("with an update pending the tray has Check for Updates... and the Dock badge is ·", async () => {
    await offer("1.1.0");
    await component.generateMenu();

    expect(labels()).toContain("Check for Updates...");
    expect(badges[badges.length - 1]).toBe("·");
  });

  it("Check for Updates... reopens the update dialog", async () => {
    await offer("1.1.0");
    modals[0].initialState.callback("closed-without-answer");
    await component.generateMenu();

    menu()
      .find((voice) => voice.label === "Check for Updates...")
      .click();
    expect(modals.length).toBe(2);
  });

  it("once the version is acknowledged the tray entry and the Dock badge are gone", async () => {
    await offer("1.1.0");
    await component.generateMenu();
    expect(badges[badges.length - 1]).toBe("·");

    modals[0].initialState.callback(constants.confirmClosedAndIgnoreUpdate);
    await component.generateMenu();

    expect(labels()).not.toContain("Check for Updates...");
    expect(badges[badges.length - 1]).toBe("");
  });

  it("Linux and Windows have no Dock badge", async () => {
    os = OperatingSystem.linux;
    await offer("1.1.0");
    await component.generateMenu();

    expect(labels()).toContain("Check for Updates...");
    expect(badges).toEqual([]);
  });
});
