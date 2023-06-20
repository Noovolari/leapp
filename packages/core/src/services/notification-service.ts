import { Repository } from "./repository";
import { LeappNotification } from "../models/notification";

export class NotificationService {
  constructor(private repository: Repository) {
    if (!this.repository.getNotifications()) {
      this.repository.setNotifications([]);
    }
  }

  getNotifications(unread?: boolean): LeappNotification[] {
    if (unread !== undefined && unread === true) {
      return this.repository.getNotifications().filter((n: LeappNotification) => !n.read);
    }
    return this.repository.getNotifications();
  }

  setNotificationAsRead(uuid: string): void {
    const notifications = this.getNotifications();
    notifications.forEach((n: LeappNotification) => {
      if (n.uuid === uuid) {
        n.read = true;
      }
    });
    this.repository.setNotifications(notifications);
  }

  setNotifications(notifications: LeappNotification[]): void {
    this.repository.setNotifications(notifications);
  }

  removeNotification(notificationToBeRemoved: LeappNotification): void {
    const notifications = this.getNotifications();
    const newNotifications = notifications.filter((notification) => notification.uuid !== notificationToBeRemoved.uuid);
    this.setNotifications(newNotifications);
  }

  getNotificationByUuid(uuid: string): LeappNotification | undefined {
    return this.getNotifications().find((leappNotification) => leappNotification.uuid === uuid);
  }
}
