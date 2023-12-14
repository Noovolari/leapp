import { beforeEach, describe, test, jest, expect } from "@jest/globals";
import { LeappNotification, LeappNotificationType } from "../models/notification";
import { NotificationService } from "./notification-service";

describe("NotificationService", () => {
  let mockedNotification1: LeappNotification;
  let mockedNotification2: LeappNotification;
  let mockedNotifications: LeappNotification[] = [];
  let mockedRepository: any;

  beforeEach(() => {
    mockedNotification1 = new LeappNotification("1234a", LeappNotificationType.info, "title1", "Ok", "", false);
    mockedNotification2 = new LeappNotification("3456a", LeappNotificationType.info, "title2", "Ok", "", true);
    mockedNotifications = [mockedNotification1, mockedNotification2];

    mockedRepository = {
      getNotifications: jest.fn(() => mockedNotifications),
      setNotifications: jest.fn((notifications: LeappNotification[]) => (mockedNotifications = notifications)),
    } as any;
  });

  test("constructor", () => {
    mockedRepository.setNotifications(undefined);
    let service = new NotificationService(mockedRepository);
    expect(service.getNotifications()).toEqual([]);

    mockedRepository.setNotifications(mockedNotifications);
    service = new NotificationService(mockedRepository);
    expect(service.getNotifications()).toEqual(mockedNotifications);
  });

  test("getNotifications() - can return both all notifications or only the unread ones", () => {
    const service = new NotificationService(mockedRepository);
    let notifications = service.getNotifications();

    expect(notifications).toStrictEqual(mockedNotifications);
    expect(mockedRepository.getNotifications).toHaveBeenCalled();

    notifications = service.getNotifications(false);
    expect(notifications).toEqual(mockedNotifications);
    expect(mockedRepository.getNotifications).toHaveBeenCalled();

    notifications = service.getNotifications(true);
    expect(notifications).toEqual([mockedNotification1]);
    expect(mockedRepository.getNotifications).toHaveBeenCalled();
  });

  test("setNotificationAsRead() - set the specific notification as read, if the uuid is missing or not found nothing is touched", () => {
    const service = new NotificationService(mockedRepository);
    service.setNotificationAsRead("1234aNotExist");
    let notifications = service.getNotifications();
    expect(notifications).toStrictEqual(mockedNotifications);
    expect(mockedRepository.getNotifications).toHaveBeenCalled();

    service.setNotificationAsRead("1234a");
    notifications = service.getNotifications(true);
    expect(notifications).toEqual([]);
    expect(mockedRepository.getNotifications).toHaveBeenCalled();
  });

  test("setNotifications() - set the notifications", () => {
    const service = new NotificationService(mockedRepository);
    service.setNotifications([]);
    let notifications = service.getNotifications();
    expect(mockedRepository.setNotifications).toHaveBeenCalledWith([]);
    expect(notifications).toEqual([]);

    service.setNotifications([mockedNotification1, mockedNotification2]);
    notifications = service.getNotifications();
    expect(mockedRepository.setNotifications).toHaveBeenCalledWith([mockedNotification1, mockedNotification2]);
    expect(notifications).toEqual([mockedNotification1, mockedNotification2]);
  });

  test("removeNotification() - remove a notification", () => {
    const service = new NotificationService(mockedRepository);
    expect(service.getNotifications()).toEqual(mockedNotifications);
    service.removeNotification(mockedNotification2);
    expect(service.getNotifications()).toEqual([mockedNotification1]);
  });

  test("getNotificationByUuid", () => {
    const service = new NotificationService(mockedRepository);
    (service as any).getNotifications = jest.fn(() => [{ uuid: "another-uuid" }, { uuid: "correct-uuid" }]);

    service.getNotificationByUuid("correct-uuid");
    expect(service.getNotifications());
  });
});
