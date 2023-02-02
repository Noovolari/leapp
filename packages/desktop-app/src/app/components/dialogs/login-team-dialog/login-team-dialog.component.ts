import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { User } from "leapp-team-core/user/user";
import { globalUser } from "../../command-bar/command-bar.component";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { ConfigurationService } from "leapp-angular-common";

@Component({
  selector: "app-login-team-dialog",
  templateUrl: "./login-team-dialog.component.html",
  styleUrls: ["./login-team-dialog.component.scss"],
})
export class LoginTeamDialogComponent implements OnInit {
  private loggingService: LogService;

  constructor(public appService: AppService, public leappCoreService: AppProviderService, private messageToasterservice: MessageToasterService) {
    this.loggingService = leappCoreService.logService;
    ConfigurationService.setForcedAPiEndpoint("http://example.com");
  }

  ngOnInit(): void {}

  async onSignIn($event: User): Promise<void> {
    const user: User = $event;
    globalUser.next(user);
    this.closeModal();
    this.loggingService.log(new LoggedEntry(`Welcome ${user.firstName}`, this, LogLevel.success));
    this.messageToasterservice.toast(`Welcome ${user.firstName}`, ToastLevel.success, "Log In to Team Portal");
  }

  onError(error: string | number): void {
    this.loggingService.log(new LoggedEntry(`Error while trying to sign in: ${error}`, this, LogLevel.warn));
    this.messageToasterservice.toast(`Error while trying to sign in: ${error}`, ToastLevel.warn, "Log In to Team Portal");
  }

  goBack(): void {
    this.appService.closeModal();
  }

  closeModal(): void {
    this.appService.closeModal();
  }
}
