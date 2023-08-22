import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SideBarComponent } from "./side-bar.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";
import { MatMenuModule } from "@angular/material/menu";

describe("SideBarComponent", () => {
  let component: SideBarComponent;
  let fixture: ComponentFixture<SideBarComponent>;

  beforeEach(async () => {
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
      getSegments: [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      repository: spyRepositoryService,
      segmentService: { list: () => [] },
      awsCoreService: { getRegions: () => [] },
      teamService: {
        workspaceState: {
          subscribe: () => {
            component.workspacesState = { id: "mocked-id" } as any;
          },
        },
        signedInUserState: {
          subscribe: () => {
            component.loggedUser = { teamName: "mock-name" } as any;
          },
        },
      },
    });

    await TestBed.configureTestingModule({
      declarations: [SideBarComponent],
      imports: [MatMenuModule],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyLeappCoreService })),
    }).compileComponents();

    fixture = TestBed.createComponent(SideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).subscription = {
      unsubscribe: () => {},
    };
    (component as any).workspaceNameSubscription = {
      unsubscribe: () => {},
    };
    (component as any).userSubscription = {
      unsubscribe: () => {},
    };
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
