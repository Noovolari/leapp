import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TrayMenuComponent } from "./tray-menu.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";

describe("TrayMenuComponent", () => {
  let component: TrayMenuComponent;
  let fixture: ComponentFixture<TrayMenuComponent>;

  beforeEach(async(() => {
    const spyWorkspaceService = jasmine.createSpyObj("WorkspaceService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      workspaceService: spyWorkspaceService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [] },
      executeService: { execute: () => ({ then: () => {} }) },
    });

    window.__dirname = "";

    TestBed.configureTestingModule({
      declarations: [TrayMenuComponent],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyLeappCoreService })),
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrayMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    (component as any).subscribed = {
      unsubscribe: () => {},
    };
    (component as any).getMetadata = () => {};
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
