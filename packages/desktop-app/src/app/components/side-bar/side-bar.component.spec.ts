import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SideBarComponent } from "./side-bar.component";
import { mustInjected } from "../../../base-injectables";
import { AppProviderService } from "../../services/app-provider.service";

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
    });

    await TestBed.configureTestingModule({
      declarations: [SideBarComponent],
      providers: [].concat(mustInjected().concat({ provide: AppProviderService, useValue: spyLeappCoreService })),
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
