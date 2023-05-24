import { describe, expect, test } from "@jest/globals";
import { LeappNotification, LeappNotificationType } from "./notification";

describe("Notification Model", () => {
  test("should create", () => {
    const mockedNotification = new LeappNotification("fake-uuid", LeappNotificationType.info, "fake-title", "fake-description", false);
    expect(mockedNotification).toBeInstanceOf(LeappNotification);
    expect(mockedNotification).toBeTruthy();
    expect(mockedNotification.link).toBeUndefined();
    expect(mockedNotification.type).toEqual(LeappNotificationType.info);
  });
});
