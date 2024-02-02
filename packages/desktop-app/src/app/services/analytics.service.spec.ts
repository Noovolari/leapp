import { TestBed } from "@angular/core/testing";
import { AnalyticsService } from "./analytics.service";
import { Role, User } from "./team-service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let user: User;
  let date: Date;
  let appProviderService: any = {};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = new AnalyticsService(appProviderService);

    jasmine.clock().install();
    date = new Date();
    jasmine.clock().mockDate(date);

    user = {
      teamId: "1",
      teamName: "team",
      role: Role.user,
      email: "email@email.com",
      firstName: "fn",
      lastName: "ln",
    };
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
    const spy = spyOn(AnalyticsService.prototype, "initConfig").and.stub();
    service = new AnalyticsService(appProviderService);
    expect(spy).toHaveBeenCalled();
  });

  it("init()", () => {
    const spy1 = spyOn(service as any, "captureGroupOnce").and.stub();
    const spy2 = spyOn(service as any, "captureUser").and.stub();
    service.init(user);

    expect(spy1).toHaveBeenCalledWith("1", "team", date.toISOString(), "user");
    expect(spy2).toHaveBeenCalledWith(user, date.toISOString());
  });

  it("captureEvent()", async () => {
    appProviderService = {
      teamService: {
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        signedInUserState: {
          getValue: jasmine.createSpy().and.returnValue({ accessToken: "mocked-access-token", email: "mocked@email.com" }),
        },
      },
    } as any;
    const service2 = new AnalyticsService(appProviderService);
    const spy2 = spyOn((service2 as any).myPosthog, "capture").and.stub();
    await service2.captureEvent("event", { dummy: "test" });
    expect(spy2).toHaveBeenCalledWith("event", {
      ["leapp_agent"]: "Desktop App",
      environment: "development",
      $set: { email: "mocked@email.com" },
      dummy: "test",
    });
  });

  it("captureEvent() - if anonymous user do not log the event", async () => {
    appProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jasmine.createSpy().and.returnValue({ accessToken: "" }),
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    } as any;
    const service2 = new AnalyticsService(appProviderService);
    const spy2 = spyOn((service2 as any).myPosthog, "capture").and.stub();
    await service2.captureEvent("event", { dummy: "test" });
    expect(spy2).not.toHaveBeenCalled();
  });

  it("captureUser()", () => {
    const spy = spyOn((service as any).myPosthog, "identify").and.stub();
    service.captureUser(user, date.toISOString());

    expect(spy).toHaveBeenCalledWith(user.userId, {
      email: "email@email.com",
      role: "user",
      firstName: "fn",
      lastName: "ln",
      created: date.toISOString(),
    });
  });

  it("captureGroupOnce()", () => {
    const spy = spyOn((service as any).myPosthog, "group").and.stub();
    service.captureGroupOnce("1", "company", date.toISOString(), "pro");

    expect(spy).toHaveBeenCalledWith("company", "1", { name: "company", tier: "PRO" });

    service.captureGroupOnce("1", "company", date.toISOString(), "manager");

    expect(spy).toHaveBeenCalledWith("company", "1", { name: "company", tier: "TEAM" });
  });

  it("capturePageView()", () => {
    const spy = spyOn((service as any).myPosthog, "capture").and.stub();
    service.capturePageView();

    expect(spy).toHaveBeenCalledWith("$pageview", { ["leapp_agent"]: "Desktop App" });
  });
  it("reset()", () => {
    const spy = spyOn((service as any).myPosthog, "reset").and.stub();
    (service as any).reset();

    expect(spy).toHaveBeenCalled();
  });
});
