import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";

@Injectable({
  providedIn: "root",
})
export class NotificationsService {
  private lastNotificationUrl = "https://chi22cxwa1.execute-api.eu-west-1.amazonaws.com/dev/daily-notification";
  private alreadyShownNotifications: Set<string>;

  constructor(private httpClient: HttpClient, private messageToasterService: MessageToasterService) {
    this.alreadyShownNotifications = new Set();
  }

  startNotificationChecking(): void {
    setInterval(() => {
      this.httpClient.get(this.lastNotificationUrl).subscribe((value: any) => {
        const notifications = value.body.map((n: any) => ({ message: n.message["S"], title: n.title["S"], id: n.notification_timestamp["N"] })) as {
          message: string;
          title: string;
          id: string;
        }[];
        let delay = 0;
        for (const notification of notifications) {
          if (!this.alreadyShownNotifications.has(notification.id)) {
            setTimeout(() => {
              this.messageToasterService.toast(notification.message, ToastLevel.info, notification.title);
            }, delay);
            delay += 2000;
            this.alreadyShownNotifications.add(notification.id);
          }
        }
      });
    }, 10000);
  }
}
