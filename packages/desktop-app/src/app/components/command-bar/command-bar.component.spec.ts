import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CommandBarComponent } from "./command-bar.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { OptionsService } from "../../services/options.service";

describe("CommandBarComponent", () => {
  let component: CommandBarComponent;
  let fixture: ComponentFixture<CommandBarComponent>;

  beforeEach(async () => {
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getColorTheme: () => constants.darkTheme,
      setNotifications: () => {},
      getNotifications: () => [],
    });
    const spyNotificationsService = jasmine.createSpyObj("Notification", {
      setNotifications: () => {},
      getNotifications: () => [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      behaviouralSubjectService: spyBehaviouralSubjectService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [] },
      namedProfileService: { getNamedProfiles: () => [] },
      notificationService: spyNotificationsService,
    });

    const optionsService = { colorTheme: "dark-theme" };

    await TestBed.configureTestingModule({
      declarations: [CommandBarComponent],
      providers: [].concat(
        mustInjected().concat([
          { provide: AppProviderService, useValue: spyLeappCoreService },
          { provide: OptionsService, useValue: optionsService },
        ])
      ),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).subscription0 = {
      unsubscribe: () => {},
    };
    (component as any).subscription1 = {
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
    (component as any).optionsService = { colorTheme: "dark-theme", workspaceService: { getWorkspace: () => new Workspace() } };
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
