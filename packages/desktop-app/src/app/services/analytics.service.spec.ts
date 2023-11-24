import { TestBed } from "@angular/core/testing";

import { AnalyticsService } from "./analytics.service";
import { User } from "../leapp-team-core/user/user";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let user: User;
  let date: Date;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);

    jasmine.clock().install();
    date = new Date();
    jasmine.clock().mockDate(date);

    user = new User("1", "fn", "ln", "email@email.com", "user", "team", "1", "", "", "", "");
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
    const spy = spyOn(AnalyticsService.prototype, "initConfig").and.stub();
    service = new AnalyticsService();
    expect(spy).toHaveBeenCalled();
  });

  it("init()", () => {
    const spy1 = spyOn(service as any, "captureGroupOnce").and.stub();
    const spy2 = spyOn(service as any, "captureUser").and.stub();
    service.init(user);

    expect(spy1).toHaveBeenCalledWith("1", "team", date.toISOString(), "Free Trial");
    expect(spy2).toHaveBeenCalledWith(user, date.toISOString());
  });

  it("captureEvent()", () => {
    const spy1 = spyOn(service as any, "captureUser").and.stub();
    const spy2 = spyOn((service as any).myPosthog, "capture").and.stub();
    service.captureEvent("event", user);

    expect(spy1).toHaveBeenCalledWith(user);
    expect(spy2).toHaveBeenCalledWith("event", { ["leapp_agent"]: "Portal", groups: { company: undefined } });
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
    service.captureGroupOnce("1", "company", date.toISOString(), "free trial");

    expect(spy).toHaveBeenCalledWith("company", "1", { name: "company", plan: "free trial", created: date.toISOString() });
  });

  it("capturePageView()", () => {
    const spy = spyOn((service as any).myPosthog, "capture").and.stub();
    service.capturePageView();

    expect(spy).toHaveBeenCalledWith("$pageview");
  });
  it("reset()", () => {
    const spy = spyOn((service as any).myPosthog, "reset").and.stub();
    service.reset();

    expect(spy).toHaveBeenCalled();
  });
});
