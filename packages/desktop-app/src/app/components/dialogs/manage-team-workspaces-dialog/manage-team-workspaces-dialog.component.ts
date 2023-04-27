import { Component, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { User } from "leapp-team-core/user/user";

@Component({
  selector: "app-manage-team-workspaces-dialog",
  templateUrl: "./manage-team-workspaces-dialog.component.html",
  styleUrls: ["./manage-team-workspaces-dialog.component.scss"],
})
export class ManageTeamWorkspacesDialogComponent implements OnInit {
  localWorkspaceName: string;
  loggedUser: User;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private userSubscription;

  constructor(private appProviderService: AppProviderService, public appService: AppService) {
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.loggedUser = null;
    this.localWorkspaceName = constants.localWorkspaceName;
  }

  get doesTeamExist(): boolean {
    return !!this.loggedUser;
  }

  ngOnInit(): void {
    this.userSubscription = this.appProviderService.teamService.signedInUserState.subscribe((user: User) => (this.loggedUser = user));
  }

  closeModal(): void {
    this.appService.closeModal();
  }
}
