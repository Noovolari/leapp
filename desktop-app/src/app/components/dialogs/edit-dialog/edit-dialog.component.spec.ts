import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDialogComponent } from "./edit-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";
import { Session } from "@noovolari/leapp-core/models/session";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";
import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws-named-profile";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";
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

  beforeEach(async () => {
    const spyWorkspaceService = jasmine.createSpyObj("WorkspaceService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getColorTheme: () => constants.darkTheme,
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      workspaceService: spyWorkspaceService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [{ region: "eu-west-1" }] },
      azureCoreService: { getLocations: () => [] },
      sessionFactory: { getSessionService: () => {} },
    });
    const spyKeychainService = jasmine.createSpyObj("KeychainService", ["getSecret"]);
    spyKeychainService.getSecret.and.callFake((_: string, __: string) => Promise.resolve("fake-secret"));

    await TestBed.configureTestingModule({
      declarations: [EditDialogComponent],
      providers: [].concat(
        mustInjected().concat([
          { provide: AppProviderService, useValue: spyLeappCoreService },
          { provide: KeychainService, useValue: spyKeychainService },
        ])
      ),
      imports: [RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDialogComponent);
    component = fixture.componentInstance;
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
      getSessionById: (_: string): Session => ({
        sessionId: "mocked-session-id",
        sessionName: "mocked-session-name",
        status: SessionStatus.active,
        type: SessionType.aws,
        expired: () => false,
        region: "eu-west-1",
      }),
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
