import { describe, test, expect, jest } from "@jest/globals";
import { Session } from "./session";
import { SessionStatus } from "./session-status";

describe("Session Model", () => {
  test("should create", () => {
    const mockedSession = new Session("fake-session-name", "fake-session-region");
    expect(mockedSession).toBeInstanceOf(Session);
    expect(mockedSession).toBeTruthy();
    expect(mockedSession.startDateTime).toBeUndefined();
    expect(mockedSession.status).toEqual(SessionStatus.inactive);
  });

  test("expired(), startDateTime undefined", () => {
    const mockedSession = new Session("fake-session-name", "fake-session-region");
    jest.spyOn(mockedSession, "expired");
    expect(mockedSession.startDateTime).toBeUndefined();
    mockedSession.expired();
    expect(mockedSession.expired).toReturnWith(false);
  });

  test("expired(), with startDateTime", () => {
    const mockedSession = new Session("fake-session-name", "fake-session-region");
    jest.spyOn(mockedSession, "expired");

    mockedSession.startDateTime = new Date().getTime().toString();
    expect(mockedSession.startDateTime).not.toBeUndefined();
    mockedSession.expired();
    // not yet expired, should return expired false
    expect(mockedSession.expired).toReturnWith(false);

    // session started >21 minutes prior, should return expired true
    (mockedSession.startDateTime as any) = new Date().getTime() - 21 * 60 * 1000;
    mockedSession.expired();
    expect(mockedSession.expired).toReturnWith(true);
  });
});
