// Shared Karma kit for the dialogs: the real components against an in-memory core (FakeCore) and recording doubles
// For the client boundaries (modal service, window service). Used by the dialog specs.
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA, Type } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { NgSelectModule } from "@ng-select/ng-select";
import { MatTabsModule } from "@angular/material/tabs";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { BsModalService, ModalModule } from "ngx-bootstrap/modal";
import { BehaviorSubject, of } from "rxjs";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { OperatingSystem } from "@noovolari/leapp-core/models/operating-system";
import { AppProviderService } from "../services/app-provider.service";
import { AppService } from "../services/app.service";
import { OptionsService } from "../services/options.service";
import { AppNativeService } from "../services/app-native.service";
import { WindowService } from "../services/window.service";
import { MessageToasterService } from "../services/message-toaster.service";
import { AppMfaCodePromptService } from "../services/app-mfa-code-prompt.service";
import { AnalyticsService } from "../services/analytics.service";
import { LeappSelectComponent } from "../components/leapp-select/leapp-select.component";

export const REGIONS = ["us-east-1", "eu-west-1", "eu-central-1", "eu-south-1"];
export const LOCATIONS = ["eastus", "westeurope", "northeurope"];
export const DEPRECATION_WARNINGS = [/ngModel on the same form field/, /disabled attribute with a reactive form directive/];

/** A session service double that records the create requests. */
export const sessionCreator = (
  core: { created: { type: SessionType; request: any }[] },
  type: SessionType
): { create: (request: any) => Promise<void> } => ({
  create: async (request: any) => {
    core.created.push({ type, request });
  },
});

/** In-memory core: what the dialogs read and what they write, observable by the tests. */
export class FakeCore {
  workspace = new Workspace();
  created: { type: SessionType; request: any }[] = [];
  integrationsCreated: { type: string; params: any }[] = [];
  integrationsUpdated: { id: string; params: any }[] = [];
  segments: any[] = [];
  keychain = new Map<string, string>();

  workspaceService = {
    getWorkspace: () => this.workspace,
    persistWorkspace: (workspace: Workspace) => (this.workspace = workspace),
    getDefaultProfileId: () => this.workspace.profiles[0].id,
  };
  repository = { getWorkspace: () => this.workspace, getPluginStatus: () => undefined, setPluginStatus: () => {} };
  awsCoreService = {
    getRegions: () => REGIONS.map((region) => ({ region })),
    awsConfigPath: () => "/qa/aws/config",
    awsCredentialPath: () => "/qa/aws/credentials",
    awsBkpConfigPath: () => "/qa/aws/config.leapp.bkp",
    awsBkpCredentialPath: () => "/qa/aws/credentials.leapp.bkp",
  };
  azureCoreService = { getLocations: () => LOCATIONS.map((location) => ({ location })) };
  fileService = { existsSync: () => false, writeFileSync: () => {}, readFileSync: () => "" };
  sessionManagementService = {
    getSessions: () => this.workspace.sessions,
    getActiveSessions: () => [],
    getSessionById: (id: string) => this.workspace.sessions.find((session) => session.sessionId === id),
    getAssumableSessions: () =>
      this.workspace.sessions.filter((session) =>
        [SessionType.awsIamUser, SessionType.awsIamRoleFederated, SessionType.awsSsoRole].includes(session.type)
      ),
    updateSessions: (sessions: any[]) => {
      this.workspace.sessions = sessions;
    },
  };
  sessionFactory = { getSessionService: () => ({ start: async () => {}, stop: async () => {}, validateCredentials: async () => true }) };
  keychainService = {
    getSecret: async (_service: string, account: string) => this.keychain.get(account) ?? null,
    saveSecret: async (_service: string, account: string, value: string) => {
      this.keychain.set(account, value);
    },
  };
  namedProfileService = {
    getNamedProfiles: () => this.workspace.profiles.filter((profile) => profile.name !== "default"),
    getProfileName: (id: string) => this.workspace.profiles.find((profile) => profile.id === id).name,
    changeNamedProfile: async (session: any, profileId: string) => {
      session.profileId = profileId;
    },
    // Same answers as core NamedProfilesService.validateNewProfileName
    validateNewProfileName: (name: string): true | string =>
      name === "default"
        ? '"default" is not a valid profile name'
        : this.workspace.profiles.some((profile) => profile.name === name)
        ? "Profile already exists"
        : true,
    createNamedProfile: (name: string) => {
      const profile = { id: `profile-${name}`, name };
      this.workspace.profiles = [...this.workspace.profiles, profile];
      return profile;
    },
    getDefaultProfileId: () => this.workspace.profiles[0].id,
  };
  idpUrlService = { getIdpUrls: () => this.workspace.idpUrls, getIdpUrl: (id: string) => this.workspace.idpUrls.find((idp) => idp.id === id) };
  pluginManagerService = { pluginContainers: [], verifyAndGeneratePluginFolderIfMissing: () => {}, loadFromPluginDir: async () => {} };
  teamService = {
    workspacesState: new BehaviorSubject([{ name: constants.localWorkspaceName, selected: true }]),
    signedInUserState: new BehaviorSubject(null),
    pushToRemote: async () => {},
    setSyncState: () => {},
  };
  logService = { log: () => {} };
  behaviouralSubjectService = {
    sessions: [],
    setSessions: () => {},
    integrations$: new BehaviorSubject([]),
    setIntegrations: () => {},
    unselectSessions: () => {},
  };
  segmentService = {
    list: () => this.segments,
    setSegments: (segments: any[]) => {
      this.segments = segments;
    },
  };
  integrationFactory = {
    getIntegrations: () => [],
    create: async (type: string, params: any) => {
      this.integrationsCreated.push({ type, params });
    },
    update: async (id: string, params: any) => {
      this.integrationsUpdated.push({ id, params });
    },
  };
  awsIamUserService = sessionCreator(this, SessionType.awsIamUser);
  awsIamRoleChainedService = sessionCreator(this, SessionType.awsIamRoleChained);
  awsIamRoleFederatedService = sessionCreator(this, SessionType.awsIamRoleFederated);
  localstackSessionService = sessionCreator(this, SessionType.localstack);
  azureSessionService = sessionCreator(this, SessionType.azure);
  awsSsoRoleService = { setAwsIntegrationDelegate: () => {} };
  awsSsoOidcService = { interrupt: () => {}, listeners: [] };
  awsSsoIntegrationService = { getIntegration: () => undefined, getIntegrations: () => [] };
  azureIntegrationService = { getIntegrations: () => [] };
}

/** What the dialog modal service was asked to show, with the callback the dialog passed. */
export class RecordingModalService {
  shown: { component: any; options: any }[] = [];
  show(component: any, options: any): any {
    this.shown.push({ component, options });
    return { hide: () => {}, content: {}, onHidden: of(undefined) };
  }
  hide(): void {}
}

export interface Harness<T> {
  fixture: ComponentFixture<T>;
  component: T;
  core: FakeCore;
  modal: RecordingModalService;
  warnings: string[];
  closeModal: jasmine.Spy;
  /** Messages of the toasts shown so far (context for failed saves). */
  toasts: () => string[];
}

export const settle = async (fixture: ComponentFixture<any>): Promise<void> => {
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    await fixture.whenStable();
  }
};

export const configure = async <T>(
  component: Type<T>,
  opts: { realModal?: boolean; inputs?: (core: FakeCore) => Partial<T>; before?: (core: FakeCore) => void; windowService?: any } = {}
): Promise<Harness<T>> => {
  const core = new FakeCore();
  opts.before?.(core);
  const modal = new RecordingModalService();
  const warnings: string[] = [];
  spyOn(console, "warn").and.callFake((...args: any[]) => warnings.push(args.map(String).join(" ")));
  const closeModal = jasmine.createSpy("closeModal");
  const toast = jasmine.createSpy("toast");
  const appService = {
    closeModal,
    validateAllFormFields: () => {},
    isDarkMode: () => false,
    detectOs: () => OperatingSystem.mac,
    restart: () => {},
    getRegions: () => REGIONS.map((region) => ({ region })),
  };

  await TestBed.configureTestingModule({
    imports: [
      CommonModule,
      FormsModule,
      // report every deprecated binding, not only the first one of the test run
      ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: "always" }),
      NgSelectModule,
      MatTabsModule,
      MatCheckboxModule,
      NoopAnimationsModule,
      ...(opts.realModal ? [ModalModule] : []),
    ],
    declarations: [component, LeappSelectComponent],
    providers: [
      { provide: AppProviderService, useValue: core },
      { provide: AppService, useValue: appService },
      { provide: OptionsService, useFactory: () => new OptionsService(core as any) },
      { provide: AppNativeService, useValue: { os: { homedir: () => "/qa" }, path: { join: (...parts: string[]) => parts.join("/") }, shell: {} } },
      { provide: WindowService, useValue: opts.windowService ?? { confirmDialog: () => {}, openExternalUrl: () => {} } },
      { provide: MessageToasterService, useValue: { toast } },
      { provide: Router, useValue: { navigate: async () => true } },
      { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      { provide: AppMfaCodePromptService, useValue: { keepUnderlyingModal: false } },
      { provide: AnalyticsService, useValue: { captureEvent: () => {} } },
      ...(opts.realModal ? [] : [{ provide: BsModalService, useValue: modal }]),
    ],
    schemas: [NO_ERRORS_SCHEMA],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  Object.assign(fixture.componentInstance, opts.inputs?.(core) ?? {});
  fixture.detectChanges();
  await settle(fixture);
  const toasts = (): string[] => toast.calls.allArgs().map((args) => String(args[0]?.message ?? args[0]));
  return { fixture, component: fixture.componentInstance, core, modal, warnings, closeModal, toasts };
};

export const ngSelect = (root: ParentNode, controlName: string): HTMLElement => {
  const element = root.querySelector(`[formcontrolname="${controlName}"]`) as HTMLElement;
  if (!element) {
    throw new Error(`no control ${controlName} rendered`);
  }
  return element;
};

/** Label the ng-select shows for its current value. */
export const shown = (root: ParentNode, controlName: string): string =>
  ngSelect(root, controlName).querySelector(".ng-value-label")?.textContent.trim() ?? "";

/** Picks an option of an ng-select the way a user does: open it, click the option. */
export const pick = async (fixture: ComponentFixture<any>, root: ParentNode, controlName: string, label: string): Promise<void> => {
  const select = ngSelect(root, controlName);
  select.querySelector(".ng-select-container").dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  await settle(fixture);
  const options = Array.from(document.querySelectorAll(".ng-dropdown-panel .ng-option")) as HTMLElement[];
  const option = options.find((candidate) => candidate.textContent.trim() === label);
  if (!option) {
    throw new Error(`option "${label}" of ${controlName} not found; options: ${options.map((o) => o.textContent.trim()).join(", ")}`);
  }
  option.click();
  await settle(fixture);
};

/** Opens a tab of the Options dialog by its label. */
export const openTab = async (fixture: ComponentFixture<any>, label: string): Promise<void> => {
  const tab = (Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[]).find(
    (candidate) => candidate.querySelector(".mat-tab-label-text")?.textContent.trim() === label
  );
  tab.click();
  await settle(fixture);
};

export const checkbox = (root: ParentNode, controlName: string): HTMLInputElement =>
  ngSelect(root, controlName).querySelector("input[type=checkbox]") as HTMLInputElement;

export const deprecations = (warnings: string[]): string[] =>
  warnings.filter((warning) => DEPRECATION_WARNINGS.some((pattern) => pattern.test(warning)));

export const nativeOf = (harness: Harness<any>): HTMLElement => harness.fixture.nativeElement;
