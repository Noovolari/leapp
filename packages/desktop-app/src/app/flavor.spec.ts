import { TestBed, waitForAsync } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { mustInjected } from "../base-injectables";
import { AppProviderService } from "./services/app-provider.service";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { AwsCoreService } from "@noovolari/leapp-core/services/aws-core-service";
import { SyncProWidgetComponent } from "./components/sync-pro-widget/sync-pro-widget.component";
import { globalLeappProPlanStatus, LeappPlanStatus } from "./components/dialogs/options-dialog/options-dialog.component";

import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";

declare const process: { env: { [key: string]: string | undefined } };

const home = "/home/tester";
const join = (...parts: string[]): string => parts.join("/").replace(/\/+/g, "/");
const dirname = (file: string): string => file.substring(0, file.lastIndexOf("/"));
const trimSlash = (dir: string): string => dir.replace(/\/$/, "");

/** In-memory filesystem shared by the fake FileService and the fake native fs. */
class FakeDisk {
  readonly files = new Map<string, string>();
  readonly dirs = new Set<string>();
  readonly renames: [string, string][] = [];

  fileService(): any {
    return {
      homeDir: () => home,
      existsSync: (p: string) => this.files.has(p) || this.dirs.has(trimSlash(p)),
      renameSync: (from: string, to: string) => {
        this.renames.push([from, to]);
        this.files.set(to, this.files.get(from));
        this.files.delete(from);
      },
      writeFileSyncWithOptions: (p: string, content: string) => this.files.set(p, content),
    };
  }

  nativeService(env: { [key: string]: string }): any {
    return {
      fs: {
        existsSync: (p: string) => this.files.has(p) || this.dirs.has(trimSlash(p)),
        mkdirSync: (p: string) => this.dirs.add(trimSlash(p)),
      },
      os: { homedir: () => home },
      path: { join, dirname },
      process: { env },
    };
  }
}

describe("build flavors (desktop-app)", () => {
  let savedFlavor: string | undefined;

  beforeEach(() => {
    savedFlavor = process.env.LEAPP_FLAVOR;
  });

  afterEach(() => {
    if (savedFlavor === undefined) {
      delete process.env.LEAPP_FLAVOR;
    } else {
      process.env.LEAPP_FLAVOR = savedFlavor;
    }
  });

  describe("AppComponent start-up files", () => {
    let app: AppComponent;
    let disk: FakeDisk;
    let showMessageBox: jasmine.Spy;

    const wire = (env: { [key: string]: string }): void => {
      const native = disk.nativeService(env);
      (app as any).fileService = disk.fileService();
      (app as any).appNativeService = native;
      (app as any).awsCoreService = new AwsCoreService(null, native, null);
      (app as any).loggingService = { log: () => {} };
      (app as any).behaviouralSubjectService = { sessions: [] };
      (app as any).appService = { getDialog: () => ({ showMessageBox }) };
      // the Electron renderer has __dirname (nodeIntegration); Karma's browser does not
      (window as any).__dirname = "/opt/leapp/resources/app";
    };

    beforeEach(waitForAsync(() => {
      // same provider stub as app.component.spec.ts: enough for the component to be created
      const workspaceService = {
        sessions: [],
        sessions$: { subscribe: () => {} },
        workspaceExists: () => true,
        getWorkspace: () => new Workspace(),
        persistWorkspace: () => {},
      };
      const repository = { getProfiles: () => [], getSessions: () => [], createWorkspace: () => {}, getWorkspace: () => new Workspace() };
      const provider = { workspaceService, repository, awsCoreService: { getRegions: () => [] } };
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: provider })),
        declarations: [AppComponent],
      }).compileComponents();
    }));

    beforeEach(() => {
      app = TestBed.createComponent(AppComponent).componentInstance;
      disk = new FakeDisk();
      showMessageBox = jasmine.createSpy("showMessageBox");
    });

    it("with zero sessions only the credentials file at AWS_SHARED_CREDENTIALS_FILE is backed up", () => {
      process.env.LEAPP_FLAVOR = "dev";
      disk.files.set("/sandbox/aws/credentials", "[foreign]\n");
      disk.files.set(`${home}/.aws/credentials`, "[real]\n");
      wire({ ["AWS_SHARED_CREDENTIALS_FILE"]: "/sandbox/aws/credentials", ["AWS_CONFIG_FILE"]: "/sandbox/aws/config" });

      (app as any).showCredentialBackupMessageIfNeeded();

      expect(disk.renames).toEqual([["/sandbox/aws/credentials", "/sandbox/aws/credentials.leapp.bkp"]]);
      expect(disk.files.get(`${home}/.aws/credentials`)).toBe("[real]\n");
      expect(disk.files.has(`${home}/.aws/credentials.leapp.bkp`)).toBe(false);
    });

    it("without the AWS variables the backup still targets ~/.aws/credentials (prod behaviour kept)", () => {
      delete process.env.LEAPP_FLAVOR;
      disk.files.set(`${home}/.aws/credentials`, "[real]\n");
      wire({});

      (app as any).showCredentialBackupMessageIfNeeded();

      expect(disk.renames).toEqual([[`${home}/.aws/credentials`, `${home}/.aws/credentials.leapp.bkp`]]);
    });

    it("in the dev flavor the start-up folders are ~/.Leapp-dev and the folder of the resolved credentials file", () => {
      process.env.LEAPP_FLAVOR = "dev";
      wire({ ["AWS_SHARED_CREDENTIALS_FILE"]: "/sandbox/aws/credentials", ["AWS_CONFIG_FILE"]: "/sandbox/aws/config" });

      (app as any).createFoldersIfMissing();

      expect([...disk.dirs].sort()).toEqual([`${home}/.Leapp-dev`, "/sandbox/aws"]);
    });
  });

  describe("keychain service of the desktop components", () => {
    it("in the dev flavor the plan status is read from the Leapp-dev keychain service", async () => {
      process.env.LEAPP_FLAVOR = "dev";
      const getSecret = jasmine.createSpy("getSecret").and.resolveTo(LeappPlanStatus.free);
      const provider = {
        keychainService: { getSecret },
        teamService: { workspacesState: { subscribe: () => ({ unsubscribe: () => {} }) } },
      };
      await TestBed.configureTestingModule({
        declarations: [SyncProWidgetComponent],
        imports: [RouterTestingModule],
        providers: (
          [
            { provide: MAT_SNACK_BAR_DATA, useValue: {} },
            { provide: MatSnackBarRef, useValue: {} },
          ] as any[]
        )
          .concat(mustInjected())
          .concat([{ provide: AppProviderService, useValue: provider }]),
      }).compileComponents();
      const fixture = TestBed.createComponent(SyncProWidgetComponent);
      fixture.detectChanges();

      globalLeappProPlanStatus.next(LeappPlanStatus.free);
      await fixture.whenStable();

      expect(getSecret).toHaveBeenCalledWith("Leapp-dev", "leapp-enabled-plan");
      expect(getSecret).not.toHaveBeenCalledWith("Leapp", jasmine.anything());
    });
  });
});
