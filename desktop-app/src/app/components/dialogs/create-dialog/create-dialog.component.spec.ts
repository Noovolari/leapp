import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CreateDialogComponent } from "./create-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";

describe("CreateDialogComponent", () => {
  let component: CreateDialogComponent;
  let fixture: ComponentFixture<CreateDialogComponent>;

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
      azureCoreService: { getLocations: () => [] },
      sessionFactory: { getSessionService: () => {} },
    });

    await TestBed.configureTestingModule({
      declarations: [CreateDialogComponent],
      providers: [].concat(mustInjected().concat([{ provide: AppProviderService, useValue: spyLeappCoreService }])),
      imports: [RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
