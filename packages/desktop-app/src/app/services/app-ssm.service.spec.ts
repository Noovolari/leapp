import { TestBed } from "@angular/core/testing";

import { AppSsmService } from "./app-ssm.service";
import { mustInjected } from "../../base-injectables";
import { AppProviderService } from "./app-provider.service";
import SpyObj = jasmine.SpyObj;
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";
import { AppService } from "./app.service";

describe("SsmService", () => {
  let service: AppSsmService;
  let appProviderService: SpyObj<AppProviderService>;

  beforeEach(() => {
    appProviderService = jasmine.createSpyObj("LeappCoreService", [], {
      ssmService: {
        getSsmInstances: (_0: CredentialsInfo, _1: string, _2?: any) => {},
        startSession: (_0: CredentialsInfo, _1: string, _2: string) => {},
      },
      logService: {},
      executeService: {},
      teamService: {
        signedInUserState: {
          getValue: jasmine.createSpy().and.returnValue({ accessToken: "mocked-access-token", email: "mocked@email.com" }),
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    });

    TestBed.configureTestingModule({
      providers: [AppService].concat(mustInjected()),
    });

    service = TestBed.inject(AppSsmService);
    (service as any).coreSsmService = appProviderService.ssmService;
    (service as any).logService = appProviderService.logService;
    (service as any).executeService = appProviderService.executeService;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getSsmInstances on core method passing a credential info object and a region", () => {
    const spyGetSsmInstances = spyOn(appProviderService.ssmService, "getSsmInstances").and.callThrough();
    const credentials: CredentialsInfo = { sessionToken: "abcdefghi" };

    service.getSsmInstances(credentials, "eu-west-1");
    expect(spyGetSsmInstances).toHaveBeenCalled();
  });

  it("should call startSession on core method passing a credential info object, an instance id and a region", () => {
    const spyGetSsmStartSession = spyOn(appProviderService.ssmService, "startSession").and.callThrough();
    const credentials: CredentialsInfo = { sessionToken: "abcdefghi" };

    service.startSession(credentials, "instance-id", "eu-west-1");
    expect(spyGetSsmStartSession).toHaveBeenCalledOnceWith(credentials, "instance-id", "eu-west-1");
  });
});
