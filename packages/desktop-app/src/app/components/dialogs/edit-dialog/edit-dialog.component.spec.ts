import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDialogComponent } from "./edit-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";
import { Session } from "@noovolari/leapp-core/models/session";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";
import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws/aws-named-profile";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import Folder from "@noovolari/leapp-core/models/folder";
import Segment from "@noovolari/leapp-core/models/segment";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { KeychainService } from "@noovolari/leapp-core/services/keychain-service";

describe("EditDialogComponent", () => {
  let component: EditDialogComponent;
  let fixture: ComponentFixture<EditDialogComponent>;

  beforeEach(async(() => {
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getColorTheme: () => constants.darkTheme,
      listAssumable: (): Session[] => [
        {
          sessionId: "id",
          status: SessionStatus.inactive,
          startDateTime: undefined,
          type: SessionType.awsSsoRole,
          sessionTokenExpiration: undefined,
          sessionName: "test",
          region: "eu-west-1",
          expired: () => false,
        },
      ],
      getWorkspace: (): Workspace =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mockedWorkspace,
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      workspaceService: spyBehaviouralSubjectService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [{ region: "eu-west-1" }] },
      azureCoreService: { getLocations: () => [] },
      sessionFactory: { getSessionService: () => {} },
    });
    const spyKeychainService = jasmine.createSpyObj("KeychainService", ["getSecret"]);
    spyKeychainService.getSecret.and.callFake((_: string, __: string) => Promise.resolve("fake-secret"));

    TestBed.configureTestingModule({
      declarations: [EditDialogComponent],
      providers: [].concat(
        mustInjected().concat([
          { provide: AppProviderService, useValue: spyLeappCoreService },
          { provide: KeychainService, useValue: spyKeychainService },
        ])
      ),
      imports: [RouterTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDialogComponent);

    const mockedWorkspace = {
      _awsSsoIntegrations: undefined,
      _defaultLocation: undefined,
      _defaultRegion: undefined,
      _folders: undefined,
      _idpUrls: undefined,
      _macOsTerminal: undefined,
      _pinned: undefined,
      _profiles: [],
      _proxyConfiguration: undefined,
      _segments: undefined,
      _sessions: undefined,
      _colorTheme: "dark-theme",
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
      get colorTheme(): string {
        return "dark-theme";
      },
      addIpUrl: (_: IdpUrl) => void {},
      pinned: [],
    };

    component = fixture.componentInstance;

    (component as any).repository = {
      _workspace: mockedWorkspace,
      fileService: undefined,
      nativeService: undefined,
      get workspace(): Workspace {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return <Workspace>(<unknown>mockedWorkspace);
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
      getSessionById: (_: string): Session => ({
        sessionId: "mocked-session-id",
        status: SessionStatus.active,
        type: SessionType.aws,
        sessionTokenExpiration: undefined,
        sessionName: "mocked-session-name",
        region: "eu-west-1",
        expired: () => false,
      }),
      getSessions: (): Session[] => [],
      getWorkspace: (): Workspace =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mockedWorkspace,
      listActive: (): Session[] => [],
      listAssumable: (): Session[] => [
        {
          sessionId: "id",
          status: SessionStatus.inactive,
          startDateTime: undefined,
          type: SessionType.awsSsoRole,
          sessionTokenExpiration: undefined,
          sessionName: "test",
          region: "eu-west-1",
          expired: () => false,
        },
      ],
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

    // fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
