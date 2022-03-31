import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CommandBarComponent } from "./command-bar.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";
import { constants } from "@noovolari/leapp-core/models/constants";

describe("CommandBarComponent", () => {
  let component: CommandBarComponent;
  let fixture: ComponentFixture<CommandBarComponent>;

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
      awsCoreService: { getRegions: () => [] },
    });
    await TestBed.configureTestingModule({
      declarations: [CommandBarComponent],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyLeappCoreService })),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).subscription = {
      unsubscribe: () => {},
    };
    (component as any).subscription2 = {
      unsubscribe: () => {},
    };
    (component as any).subscription3 = {
      unsubscribe: () => {},
    };
    (component as any).subscription4 = {
      unsubscribe: () => {},
    };
    (component as any).subscription5 = {
      unsubscribe: () => {},
    };
    (component as any).subscription6 = {
      unsubscribe: () => {},
    };
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
