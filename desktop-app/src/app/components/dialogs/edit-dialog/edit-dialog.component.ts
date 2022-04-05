import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AppService } from "../../../services/app.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { WorkspaceService } from "@noovolari/leapp-core/services/workspace-service";
import { KeychainService } from "@noovolari/leapp-core/services/keychain-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppProviderService } from "../../../services/app-provider.service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";
import { Repository } from "@noovolari/leapp-core/services/repository";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";
import * as uuid from "uuid";
import {Session} from "@noovolari/leapp-core/models/session";

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

  public accountType = SessionType.aws;
  public provider = SessionType.awsIamRoleFederated;
  public selectedSession: any;
  public selectedAccountNumber = "";
  public selectedIdpUrl;
  public selectedRegion;
  public regions = [];
  public workspace: Workspace;
  public eSessionType = SessionType;
  public eConstants = constants;

  public form = new FormGroup({
    idpArn: new FormControl("", [Validators.required]),
    accountNumber: new FormControl("", [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl("", [Validators.required]),
    tenantId: new FormControl("", [Validators.required]),
    name: new FormControl("", [Validators.required]),
    role: new FormControl("", [Validators.required]),
    roleArn: new FormControl("", [Validators.required]),
    roleSessionName: new FormControl("", [Validators.pattern("[a-zA-Z\\d\\-\\_\\@\\=\\,\\.]+")]),
    federatedOrIamRoleChained: new FormControl("", [Validators.required]),
    federatedRole: new FormControl("", [Validators.required]),
    federationUrl: new FormControl("", [Validators.required, Validators.pattern("https?://.+")]),
    secretKey: new FormControl("", [Validators.required]),
    accessKey: new FormControl("", [Validators.required]),
    awsRegion: new FormControl(""),
    mfaDevice: new FormControl(""),
    awsProfile: new FormControl("", [Validators.required]),
    azureLocation: new FormControl("", [Validators.required]),
    assumerSession: new FormControl("", [Validators.required]),
  });

  idpUrls: { value: string; label: string }[] = [];

  profiles: { value: string; label: string }[] = [];
  selectedProfile: { value: string; label: string };

  /* Setup the first account for the application */
  assumerAwsSessions: { session: Session; sessionName: string }[];

  private workspaceService: WorkspaceService;
  private keychainService: KeychainService;
  private repository: Repository;
  private sessionService: SessionService;

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
    this.selectedSession = this.repository.getSessionById(this.selectedSessionId) as any;
    this.sessionService = this.leappCoreService.sessionFactory.getSessionService(this.selectedSession.type);
    this.accountType = this.selectedSession.type;

    // Get the workspace and the accounts you need
    const workspace = this.leappCoreService.repository.getWorkspace();

    // We get all the applicable idp urls
    if (workspace.idpUrls && workspace.idpUrls.length > 0) {
      workspace.idpUrls.forEach((idp) => {
        if (idp !== null && idp.id) {
          this.idpUrls.push({ value: idp.id, label: idp.url });
        }
      });
    }

    // We got all the applicable profiles
    // Note: we don't use azure profile so we remove default azure profile from the list
    workspace.profiles.forEach((idp) => {
      if (idp !== null && idp.name !== constants.defaultAzureProfileName && idp.id) {
        this.profiles.push({ value: idp.id, label: idp.name });
      }
    });

    // Show the assumable accounts
    this.assumerAwsSessions = this.leappCoreService.repository.listAssumable().map((session) => ({
      sessionName: session.sessionName,
      session,
    }));

    // Get the region
    this.regions = this.leappCoreService.awsCoreService.getRegions();
    this.selectedRegion = this.regions.find((r) => r.region === this.selectedSession.region).region;
    this.form.controls["awsRegion"].setValue(this.selectedRegion);

    if (this.accountType === SessionType.awsIamRoleFederated) {
    }

    if (this.accountType === SessionType.awsIamRoleChained) {
    }

    if (this.accountType === SessionType.azure) {
    }

    if (this.accountType === SessionType.awsIamUser) {
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
  }

  selectedIdpUrlEvent($event: { items: any[]; item: any }): void {
    this.idpUrls = $event.items;
    this.selectedIdpUrl = $event.item;
  }

  compareAssumerSessions(a: any, b: any): boolean {
    console.log(a, b);
    return a?.session?.sessionId === b?.session?.sessionId;
  }

  /**
   * Add a new UUID
   */
  addNewUUID(): string {
    return uuid.v4();
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
    let result = false;
    switch (this.accountType) {
      case SessionType.awsIamRoleFederated:
        result =
          this.form.get("name").valid &&
          this.form.get("awsRegion").valid &&
          this.form.get("awsRegion").value !== null &&
          this.form.get("roleArn").valid &&
          this.selectedIdpUrl &&
          this.form.get("idpArn").valid;
        break;
      case SessionType.awsIamRoleChained:
        result =
          this.form.get("name").valid &&
          this.form.get("awsRegion").valid &&
          this.form.get("awsRegion").value !== null &&
          this.form.get("roleArn").valid &&
          this.form.get("roleSessionName").valid &&
          this.selectedSession?.sessionId;
        break;
      case SessionType.awsIamUser:
        result =
          this.form.get("name").valid &&
          this.form.get("awsRegion").valid &&
          this.form.get("awsRegion").value !== null &&
          this.form.get("mfaDevice").valid &&
          this.form.get("accessKey").valid &&
          this.form.get("secretKey").valid;
        break;
      case SessionType.azure:
        result =
          this.form.get("name").valid &&
          this.form.get("subscriptionId").valid &&
          this.form.get("tenantId").valid &&
          this.form.get("azureLocation").valid;
        break;
    }
    return result;
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
