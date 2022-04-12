import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AppService } from "../../../services/app.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamUserSession } from "@noovolari/leapp-core/models/aws-iam-user-session";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { WorkspaceService } from "@noovolari/leapp-core/services/workspace-service";
import { KeychainService } from "@noovolari/leapp-core/services/keychain-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";
import { Repository } from "@noovolari/leapp-core/services/repository";

@Component({
  selector: "app-edit-dialog",
  templateUrl: "./edit-dialog.component.html",
  styleUrls: ["./edit-dialog.component.scss"],
})
export class EditDialogComponent implements OnInit {
  @ViewChild("roleInput", { static: false })
  public roleInput: ElementRef;

  @Input()
  public selectedSessionId: string;

  public accountType = SessionType.awsIamUser;
  public provider = SessionType.awsIamRoleFederated;
  public selectedSession: AwsIamUserSession;
  public selectedAccountNumber = "";
  public selectedRegion;
  public regions = [];
  public workspace: Workspace;

  public form = new FormGroup({
    secretKey: new FormControl("", [Validators.required]),
    accessKey: new FormControl("", [Validators.required]),
    name: new FormControl("", [Validators.required]),
    awsRegion: new FormControl(""),
    mfaDevice: new FormControl(""),
  });

  private workspaceService: WorkspaceService;
  private keychainService: KeychainService;
  private repository: Repository;

  /* Setup the first account for the application */
  constructor(
    private activatedRoute: ActivatedRoute,
    private appService: AppService,
    private messageToasterService: MessageToasterService,
    private router: Router,
    private windowService: WindowService,
    private leappCoreService: AppProviderService
  ) {
    this.workspaceService = leappCoreService.workspaceService;
    this.repository = this.leappCoreService.repository;
    this.keychainService = this.leappCoreService.keyChainService;
  }

  ngOnInit(): void {
    // Get the workspace and the account you need
    this.selectedSession = this.repository.getSessionById(this.selectedSessionId) as AwsIamUserSession;

    // Get the region
    this.regions = this.leappCoreService.awsCoreService.getRegions();
    this.selectedRegion = this.regions.find((r) => r.region === this.selectedSession.region).region;
    this.form.controls["awsRegion"].setValue(this.selectedRegion);

    // Get other readonly properties
    this.form.controls["name"].setValue(this.selectedSession.sessionName);
    this.form.controls["mfaDevice"].setValue(this.selectedSession.mfaDevice);

    // eslint-disable-next-line max-len
    this.keychainService.getSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`).then((value) => {
      this.form.controls["accessKey"].setValue(value);
    });
    // eslint-disable-next-line max-len
    this.keychainService.getSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`).then((value) => {
      this.form.controls["secretKey"].setValue(value);
    });
  }

  /**
   * Save the edited account in the workspace
   */
  saveAccount(): void {
    if (this.formValid()) {
      this.selectedSession.sessionName = this.form.controls["name"].value;
      this.selectedSession.region = this.selectedRegion;
      this.selectedSession.mfaDevice = this.form.controls["mfaDevice"].value;
      // eslint-disable-next-line max-len
      this.keychainService
        .saveSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`, this.form.controls["accessKey"].value)
        .then((_) => {});
      // eslint-disable-next-line max-len
      this.keychainService
        .saveSecret(
          constants.appName,
          `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`,
          this.form.controls["secretKey"].value
        )
        .then((_) => {});

      this.repository.updateSession(this.selectedSession.sessionId, this.selectedSession);
      this.workspaceService.updateSession(this.selectedSession.sessionId, this.selectedSession);

      this.messageToasterService.toast(`Session: ${this.form.value.name}, edited.`, ToastLevel.success, "");
      this.closeModal();
    } else {
      this.messageToasterService.toast(`One or more parameters are invalid, check your choices.`, ToastLevel.warn, "");
    }
  }

  formValid(): boolean {
    return (
      this.form.get("name").valid &&
      this.selectedRegion &&
      this.form.get("mfaDevice").valid &&
      this.form.get("accessKey").valid &&
      this.form.get("secretKey").valid
    );
  }

  goBack(): void {
    this.appService.closeModal();
  }

  getIconForProvider(provider: SessionType): string {
    switch (provider) {
      case SessionType.azure:
        return "azure-logo.svg";
      case SessionType.google:
        return "google.png";
      case SessionType.alibaba:
        return "alibaba.png";
      default:
        return `aws${
          this.repository.getColorTheme() === constants.darkTheme ||
          (this.repository.getColorTheme() === constants.systemDefaultTheme && this.appService.isDarkMode())
            ? "-dark"
            : ""
        }.png`;
    }
  }

  closeModal(): void {
    this.appService.closeModal();
  }
}
