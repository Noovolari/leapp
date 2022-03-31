import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SegmentDialogComponent } from "./segment-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";

describe("SegmentDialogComponent", () => {
  let component: SegmentDialogComponent;
  let fixture: ComponentFixture<SegmentDialogComponent>;

  beforeEach(async () => {
    const spyWorkspaceService = jasmine.createSpyObj("WorkspaceService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSegments: [],
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
      declarations: [SegmentDialogComponent],
      providers: [].concat(mustInjected().concat([{ provide: AppProviderService, useValue: spyLeappCoreService }])),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
