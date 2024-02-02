import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SideBarComponent } from "./side-bar.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";
import { MatMenuModule } from "@angular/material/menu";
import { RouterTestingModule } from "@angular/router/testing";

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
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        workspacesState: {
          subscribe: () => {
            component.workspacesState = [
              {
                name: "fake-name",
                description: "fake-description",
                type: "local",
                selected: true,
                locked: false,
                id: "fake-id",
                syncState: "disabled",
              },
            ];
            return { unsubscribe: () => {} };
          },
        },
      },
    });

    await TestBed.configureTestingModule({
      declarations: [SideBarComponent],
      imports: [MatMenuModule, RouterTestingModule],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyLeappCoreService })),
    }).compileComponents();

    fixture = TestBed.createComponent(SideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).unsubscribe = () => {};
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
