import { TestBed, waitForAsync } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { mustInjected } from "../base-injectables";
import { AppProviderService } from "./services/app-provider.service";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { constants } from "@noovolari/leapp-core/models/constants";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";

describe("AppComponent", () => {
  beforeEach(waitForAsync(() => {
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
      workspaceExists: () => true,
      getWorkspace: () => new Workspace(),
      persistWorkspace: () => {},
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
      createWorkspace: () => {},
      getWorkspace: (): Workspace => new Workspace(),
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      workspaceService: spyBehaviouralSubjectService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [] },
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyLeappCoreService })),
      declarations: [AppComponent],
    }).compileComponents();
  }));

  it("should create the app", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();

    // check for deep link at app start
    (app as any).fileService = {};
    (app as any).fileService.readFileSync = jasmine
      .createSpy()
      .and.returnValue("leapp://01255ef8-open-leapp?email=test&firstName=n&lastName=g&teamName=t");
    (app as any).fileService.existsSync = jasmine.createSpy().and.returnValue(true);
    (app as any).isOpenLeappDeepLink = jasmine.createSpy().and.returnValue(true);
    (app as any).awsSsoRoleService = { setAwsIntegrationDelegate: () => {} };
    (app as any).windowService = { blockDevToolInProductionMode: () => {} };
    (app as any).createFoldersIfMissing = () => {};
    (app as any).retroCompatibilityService = { applyWorkspaceMigrations: () => {} };
    (app as any).showCredentialBackupMessageIfNeeded = () => {};
    (app as any).listenForDeepLinks = () => {};
    (app as any).updaterService = { start: () => {} };
    (app as any).timerService = { start: () => {} };
    (app as any).loggingService = { log: () => {} };
    (app as any).teamService = {
      syncingWorkspaceState: { subscribe: () => {} },
      setCurrentWorkspace: () => {},
      signedInUserState: { getValue: () => {} },
    };
    (app as any).behaviouralSubjectService = { fetchingIntegrationState$: { subscribe: () => {} } };
    (app as any).behaviouralSubjectService.sessions = [];
    (app as any).extensionWebsocketService = { bootstrap: () => {} };
    (app as any).remoteProceduresServer = { startServer: () => {} };
    (app as any).router = { navigate: jasmine.createSpy().and.returnValue(true) };

    constants.disablePluginSystem = true;
    (app as any).appNativeService = {
      os: {
        homedir: () => {},
      },
      path: {
        join: () => "",
      },
      ipcRenderer: { on: (_string, _callback) => {} },
      fs: { removeSync: () => {} },
    };

    await app.ngOnInit();
    expect((app as any).fileService.existsSync).toHaveBeenCalled();
    expect((app as any).router.navigate).toHaveBeenCalledWith(["/lock"], {
      queryParams: {
        teamMemberEmail: "test",
        teamMemberFirstName: "n",
        teamMemberLastName: "g",
        teamMemberTeamName: "t",
      },
    });
  });

  it("Should listen for deep links", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;

    (app as any).behaviouralSubjectService = { sessions: [] };
    (app as any).isOpenLeappDeepLink = jasmine.createSpy().and.returnValue(true);
    (app as any).router.navigate = jasmine.createSpy().and.callFake(() => {});
    (app as any).pluginManagerService = { installPlugin: jasmine.createSpy().and.returnValue("") };
    (app as any).appNativeService = {};

    const mockedCallback = (url) => {
      if ((app as any).isOpenLeappDeepLink(url)) {
        const afterQuestionMark = url.split("?")[1];
        const splitByAmpersand = afterQuestionMark?.split("&");
        const teamMemberEmail = splitByAmpersand[0]?.split("=")[1];
        const teamMemberFirstName = splitByAmpersand[1]?.split("=")[1];
        const teamMemberLastName = splitByAmpersand[2]?.split("=")[1];
        const teamMemberTeamName = splitByAmpersand[3]?.split("=")[1];
        if (teamMemberEmail) {
          (app as any).router.navigate(["/lock"], { queryParams: { teamMemberEmail, teamMemberFirstName, teamMemberLastName, teamMemberTeamName } });
        }
      } else if (!constants.disablePluginSystem) {
        (app as any).pluginManagerService.installPlugin(url);
      }
    };

    (app as any).appNativeService.ipcRenderer = {
      on: (_string, _callback) => {
        mockedCallback("https://fake-url?email=a");
      },
    };

    (app as any).listenForDeepLinks();

    const ipcRenderer = (app as any).appNativeService.ipcRenderer;
    ipcRenderer.on("PLUGIN_URL", null);
    expect((app as any).isOpenLeappDeepLink).toHaveBeenCalled();
    expect((app as any).router.navigate).toHaveBeenCalled();
  });

  it("isopendeeplink", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;

    let result = (app as any).isOpenLeappDeepLink("https://01255ef8-open-leapp?email=test@gmail.com");
    expect(result).toBeTruthy();
    result = (app as any).isOpenLeappDeepLink("https://open-plugin-name");
    expect(result).toBeFalsy();
  });

  it("beforeCloseInstructions", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    (app as any).loggingService = { log: jasmine.createSpy().and.callFake(() => {}) };
    (app as any).remoteProceduresServer = { stopServer: jasmine.createSpy().and.callFake(() => {}) };
    (app as any).appProviderService = {
      sessionManagementService: {
        stopAllSessions: jasmine.createSpy().and.callFake(() => {}),
      },
    };
    (app as any).teamService = { signOut: jasmine.createSpy().and.callFake(() => {}) };
    (app as any).appService = { quit: jasmine.createSpy().and.callFake(() => {}) };

    await (app as any).beforeCloseInstructions();

    expect((app as any).loggingService.log).toHaveBeenCalledWith(new LoggedEntry("Closing app with cleaning process...", this, LogLevel.info));
    expect((app as any).remoteProceduresServer.stopServer).toHaveBeenCalledTimes(1);
    expect((app as any).appProviderService.sessionManagementService.stopAllSessions).toHaveBeenCalledTimes(1);
    expect((app as any).teamService.signOut).toHaveBeenCalledTimes(1);
    expect((app as any).appService.quit).toHaveBeenCalledTimes(1);
  });
});
