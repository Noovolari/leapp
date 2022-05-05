import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SessionCardComponent } from "./session-card.component";
import { mustInjected } from "../../../../base-injectables";
import { AppProviderService } from "../../../services/app-provider.service";
import { RouterTestingModule } from "@angular/router/testing";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";
import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws-named-profile";
import Segment from "@noovolari/leapp-core/models/segment";
import { Session } from "@noovolari/leapp-core/models/session";
import Folder from "@noovolari/leapp-core/models/folder";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";
import { constants } from "@noovolari/leapp-core/models/constants";

describe("SessionCardComponent", () => {
  let component: SessionCardComponent;
  let fixture: ComponentFixture<SessionCardComponent>;

  beforeEach(async(() => {
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      workspaceService: spyBehaviouralSubjectService,
      repository: spyRepositoryService,
      namedProfileService: { getNamedProfiles: () => [] },
      awsCoreService: { getRegions: () => [] },
      azureCoreService: { getLocations: () => [] },
      sessionFactory: { getSessionService: () => {} },
    });

    TestBed.configureTestingModule({
      declarations: [SessionCardComponent],
      providers: [].concat(mustInjected().concat([{ provide: AppProviderService, useValue: spyLeappCoreService }])),
      imports: [RouterTestingModule.withRoutes([])],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionCardComponent);

    const mockedWorkspace = {
      _awsSsoIntegrations: undefined,
      _defaultLocation: undefined,
      _defaultRegion: undefined,
      _folders: undefined,
      _idpUrls: undefined,
      _macOsTerminal: undefined,
      _pinned: undefined,
      _profiles: undefined,
      _proxyConfiguration: undefined,
      _segments: undefined,
      _sessions: undefined,
      get awsSsoIntegrations(): AwsSsoIntegration[] {
        return [];
      },
      get defaultLocation(): string {
        return "";
      },
      get defaultRegion(): string {
        return "";
      },
      get folders(): Folder[] {
        return [];
      },
      get idpUrls(): IdpUrl[] {
        return [];
      },
      get macOsTerminal(): string {
        return "";
      },
      get profiles(): AwsNamedProfile[] {
        return [];
      },
      get proxyConfiguration(): { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string } {
        return { proxyPort: "", proxyProtocol: "" };
      },
      get segments(): Segment[] {
        return [];
      },
      get sessions(): Session[] {
        return [];
      },
      addIpUrl: (_: IdpUrl) => void {},
      pinned: [],
    };

    component = fixture.componentInstance;
    component.globalColumns = { namedProfile: false, provider: false, region: false, role: false };
    component.session = {
      region: "",
      sessionId: "",
      sessionName: "",
      status: undefined,
      expired: (): boolean => false,
      type: SessionType.awsSsoRole,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    component.repository = {
      _workspace: undefined,
      fileService: undefined,
      nativeService: undefined,
      get workspace(): Workspace {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return mockedWorkspace;
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      addAwsSsoIntegration: (_: string, __: string, ___: string, ____: string): void => {},
      addIdpUrl: (_: IdpUrl): void => {},
      addProfile: (_: AwsNamedProfile): void => {},
      addSession: (_: Session): void => {},
      createWorkspace: (): void => {},
      deleteAwsSsoIntegration: (_: string): void => {},
      deleteSession: (_: string): void => {},
      doesProfileExist: (_: string): boolean => false,
      getAwsSsoIntegration: (_: string | number): AwsSsoIntegration => undefined,
      getAwsSsoIntegrationSessions: (_: string | number): Session[] => [],
      getDefaultLocation: (): string => "",
      getDefaultProfileId: (): string => "",
      getDefaultRegion: (): string => "",
      getFolders: (): Folder[] => [],
      getIdpUrl: (_: string): string | null => undefined,
      getIdpUrls: (): IdpUrl[] => [],
      getProfileName: (_: string): string => "",
      getProfiles: (): AwsNamedProfile[] => [],
      getProxyConfiguration: () => {},
      getSegment: (_: string): Segment => undefined,
      getSegments: (): Segment[] => [],
      getSessionById: (_: string): Session => undefined,
      getSessions: (): Session[] => [],
      getWorkspace: (): Workspace =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mockedWorkspace,
      listActive: (): Session[] => [],
      listAssumable: (): Session[] => [],
      listAwsSsoIntegrations: (): AwsSsoIntegration[] => [],
      listAwsSsoRoles: (): Session[] => [],
      listIamRoleChained: (_?: Session): Session[] => [],
      listPending: (): Session[] => [],
      persistWorkspace: (_: Workspace): void => {},
      pinSession: (_: Session) => void {},
      removeIdpUrl: (_: string) => void {},
      removeProfile: (_: string) => void {},
      removeSegment: (_: Segment) => void {},
      setFolders: (_: Folder[]) => void {},
      setSegments: (_: Segment[]) => void {},
      unpinSession: (_: Session) => void {},
      unsetAwsSsoIntegrationExpiration: (_: string) => void {},
      // eslint-disable-next-line @typescript-eslint/naming-convention
      updateAwsSsoIntegration: (_: string, __: string, ___: string, ____: string, _____: string, ______?: string) => void {},
      updateDefaultLocation: (_: string) => void {},
      updateDefaultRegion: (_: string) => {},
      updateIdpUrl: (_: string, __: string) => {},
      updateMacOsTerminal: (_: string) => void {},
      updateProfile: (_: string, __: string) => void {},
      updateProxyConfiguration: (_: { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string }) => void {},
      updateSession: (_: string, __: Session) => void {},
      updateSessions: (_: Session[]) => void {},
      getColorTheme: () => constants.darkTheme,
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
