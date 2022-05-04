import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SessionsComponent } from "./sessions.component";
import { mustInjected } from "../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";
import { AppProviderService } from "../../services/app-provider.service";

describe("SessionComponent", () => {
  let component: SessionsComponent;
  let fixture: ComponentFixture<SessionsComponent>;

  beforeEach(async(() => {
    const spyBehaviouralSubjectService = jasmine.createSpyObj("BehaviouralSubjectService", [], {
      sessions: [],
      sessions$: { subscribe: () => {} },
    });
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      behaviouralSubjectService: spyBehaviouralSubjectService,
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => [] },
    });

    TestBed.configureTestingModule({
      declarations: [SessionsComponent],
      providers: [].concat(mustInjected().concat([{ provide: AppProviderService, useValue: spyLeappCoreService }])),
      imports: [RouterTestingModule.withRoutes([])],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionsComponent);
    component = fixture.componentInstance;
    component.eGlobalFilterGroup = {
      dateFilter: false,
      integrationFilter: [],
      profileFilter: [],
      providerFilter: [],
      regionFilter: [],
      typeFilter: [],
      searchFilter: "",
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
