import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { BsModalService } from "ngx-bootstrap/modal";
import { constants } from "@noovolari/leapp-core/models/constants";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { CommandBarComponent } from "./command-bar.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";
import { AppNativeService } from "../../services/app-native.service";
import { OptionsService } from "../../services/options.service";
import { WindowService } from "../../services/window.service";
import { UpdaterService } from "../../services/updater.service";
import { InfoDialogComponent } from "../dialogs/info-dialog/info-dialog.component";

// The bell's notification dot and "What's new" in the command bar, with the real
// UpdaterService on a fake filesystem and a fake HTTP backend for the release notes.
describe("CommandBarComponent updates", () => {
  let fixture: ComponentFixture<CommandBarComponent>;
  let component: CommandBarComponent;
  let http: HttpTestingController;
  let updater: UpdaterService;
  let shown: { component: any; config: any }[];
  let files: Map<string, string>;

  const CHANGELOG_URL = "https://asset.noovolari.com/CHANGELOG.md";

  beforeEach(async () => {
    delete process.env.LEAPP_FLAVOR;
    shown = [];
    files = new Map([["/home/qa/.Leapp/.latest.json", "1.0.0"]]);
    const native = {
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
    const notificationService = { setNotifications: () => {}, getNotifications: () => [], getNotificationByUuid: () => undefined };
    const provider = {
      behaviouralSubjectService: { sessions: [], sessions$: { subscribe: () => ({ unsubscribe: () => {} }) } },
      sessionManagementService: { updateSessions: () => {} },
      repository: { getProfiles: () => [], getColorTheme: () => constants.darkTheme, getNotifications: () => [], setNotifications: () => {} },
      awsCoreService: { getRegions: () => [] },
      namedProfileService: { getNamedProfiles: () => [] },
      teamService: {
        signedInUserState: { subscribe: () => ({ unsubscribe: () => {} }) },
        workspacesState: { subscribe: () => ({ unsubscribe: () => {} }) },
        getKeychainCurrentWorkspace: async () => "remoteWorkspace",
      },
      notificationService,
    };

    await TestBed.configureTestingModule({
      declarations: [CommandBarComponent],
      providers: [].concat(
        mustInjected().concat([
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: AppProviderService, useValue: provider },
          { provide: AppNativeService, useValue: native },
          {
            provide: WindowService,
            useValue: { openExternalUrl: () => {}, getCurrentWindow: () => ({ show: () => {}, isFullScreen: () => false }) },
          },
          { provide: OptionsService, useValue: { colorTheme: "dark-theme", workspaceService: { getWorkspace: () => new Workspace() } } },
          {
            provide: BsModalService,
            useValue: { show: (c: any, config: any) => shown.push({ component: c, config }), getModalsCount: () => 0, hide: () => {} },
          },
        ])
      ),
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    updater = TestBed.inject(UpdaterService);
    fixture = TestBed.createComponent(CommandBarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  const offer = async (version: string): Promise<void> => {
    const handled = updater.handleUpdateAvailable({ version, releaseName: version, releaseDate: "2026-12-01T10:00:00.000Z" });
    http.expectOne(CHANGELOG_URL).flush("# notes");
    await handled;
  };

  it("with an update pending the bell shows the notification dot", async () => {
    expect(component.isNotificationPending).toBe(false);
    await offer("1.1.0");
    expect(component.isNotificationPending).toBe(true);
  });

  it("once the version is acknowledged the dot disappears", async () => {
    await offer("1.1.0");
    shown[0].config.initialState.callback(constants.confirmClosedAndIgnoreUpdate);
    expect(component.isNotificationPending).toBe(false);
  });

  it("What's new opens the info dialog titled What's new with the rendered notes", async () => {
    const opened = component.goToWhatsNew();
    http.expectOne(CHANGELOG_URL).flush("# 1.1.0\n\n- fixes");
    await opened;

    expect(shown.length).toBe(1);
    expect(shown[0].component).toBe(InfoDialogComponent);
    expect(shown[0].config.initialState.title).toBe("What's new");
    expect(shown[0].config.initialState.description).toContain("<h1>1.1.0</h1>");
  });

  it("What's new opens with an empty description when the notes can't be downloaded", async () => {
    const opened = component.goToWhatsNew();
    http.expectOne(CHANGELOG_URL).flush("gone", { status: 404, statusText: "Not Found" });
    await opened;

    expect(shown[0].config.initialState.title).toBe("What's new");
    expect(shown[0].config.initialState.description).toBe("");
  });

  it("What's new renders no raw HTML and no javascript: link", async () => {
    const opened = component.goToWhatsNew();
    http.expectOne(CHANGELOG_URL).flush('# Title\n\n<img src=x onerror="window.pwned=1">\n\n[link](javascript:window.pwned=1)\n');
    await opened;

    const container = document.createElement("div");
    container.innerHTML = shown[0].config.initialState.description;
    expect(container.querySelector("h1")?.textContent).toBe("Title");
    expect(container.querySelector("img")).toBeNull();
    expect(Array.from(container.querySelectorAll("a")).filter((a) => a.getAttribute("href")?.startsWith("javascript:"))).toEqual([]);
    expect((window as any).pwned).toBeUndefined();
  });
});
