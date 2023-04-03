import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { User } from "leapp-team-core/user/user";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { TeamService } from "@noovolari/leapp-core/services/team-service";

@Component({
  selector: "app-login-team-dialog",
  templateUrl: "./login-team-dialog.component.html",
  styleUrls: ["./login-team-dialog.component.scss"],
})
export class LoginTeamDialogComponent implements OnInit {
  private loggingService: LogService;
  private teamService: TeamService;

  constructor(public appService: AppService, public appProviderService: AppProviderService, private messageToasterService: MessageToasterService) {
    this.loggingService = appProviderService.logService;
    this.teamService = appProviderService.teamService;
  }

  ngOnInit(): void {}

  async onSignIn(user: User): Promise<void> {
    await this.teamService.setSignedInUser(user);
    this.closeModal();
    this.loggingService.log(new LoggedEntry(`Welcome ${user.firstName}`, this, LogLevel.success));
    this.messageToasterService.toast(`Welcome ${user.firstName}`, ToastLevel.success, "Log In to Team Portal");
  }

  async onError(error: string | number): Promise<void> {
    this.loggingService.log(new LoggedEntry(`Error while trying to sign in: ${error}`, this, LogLevel.warn));
    this.messageToasterService.toast(`Error while trying to sign in: ${error}`, ToastLevel.warn, "Log In to Team Portal");
  }

  goBack(): void {
    this.appService.closeModal();
  }

  closeModal(): void {
    this.appService.closeModal();
  }
}
