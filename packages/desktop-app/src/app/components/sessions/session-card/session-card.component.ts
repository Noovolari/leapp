import { Component, Input, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { Router } from "@angular/router";
import * as uuid from "uuid";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { optionBarIds } from "../sessions.component";
import { MatMenuTrigger } from "@angular/material/menu";
import { IGlobalColumns } from "../../command-bar/command-bar.component";
import { EditDialogComponent } from "../../dialogs/edit-dialog/edit-dialog.component";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AppProviderService } from "../../../services/app-provider.service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { AppSsmService } from "../../../services/app-ssm.service";
import { FileService } from "@noovolari/leapp-core/services/file-service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";
import { AwsCoreService } from "@noovolari/leapp-core/services/aws-core-service";
import { AzureCoreService } from "@noovolari/leapp-core/services/azure-core-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { WindowService } from "../../../services/window.service";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamUserService } from "@noovolari/leapp-core/services/session/aws/aws-iam-user-service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { LeappBaseError } from "@noovolari/leapp-core/errors/leapp-base-error";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AppNativeService } from "../../../services/app-native.service";
import { AppAwsAuthenticationService } from "../../../services/app-aws-authentication.service";
import { CreateDialogComponent } from "../../dialogs/create-dialog/create-dialog.component";
import { OptionsService } from "../../../services/options.service";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { IKeychainService } from "@noovolari/leapp-core/interfaces/i-keychain-service";

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "tr[app-session-card]",
  templateUrl: "./session-card.component.html",
  styleUrls: ["./session-card.component.scss"],
})
export class SessionCardComponent implements OnInit {
  @Input()
  menutriggers;

  @Input()
  session!: Session;

  @Input()
  compactMode!: boolean;

  @Input()
  globalColumns: IGlobalColumns;

  @ViewChild("ssmModalTemplate", { static: false })
  ssmModalTemplate: TemplateRef<any>;

  @ViewChild("defaultRegionModalTemplate", { static: false })
  defaultRegionModalTemplate: TemplateRef<any>;

  @ViewChild("defaultProfileModalTemplate", { static: false })
  defaultProfileModalTemplate: TemplateRef<any>;

  @ViewChild(MatMenuTrigger)
  trigger: MatMenuTrigger;

  eSessionType = SessionType;
  eSessionStatus = SessionStatus;
  eOptionIds = optionBarIds;
  eConstants = constants;

  modalRef: BsModalRef;

  ssmLoading = true;
  openSsm = false;
  firstTimeSsm = true;

  selectedSsmRegion;
  selectedDefaultRegion;
  awsRegions = [];
  regionOrLocations = [];
  instances = [];
  duplicateInstances = [];
  placeholder;
  selectedProfile: any;
  profiles: { value: string; label: string }[];

  menuX: number;
  menuY: number;

  form = new FormGroup({
    awsProfile: new FormControl("", [Validators.required]),
  });

  private loggingService: LogService;
  private sessionFactory: SessionFactory;
  private fileService: FileService;
  private keychainService: IKeychainService;
  private behaviouralSubjectService: BehaviouralSubjectService;
  private sessionService: SessionService;
  private awsCoreService: AwsCoreService;
  private azureCoreService: AzureCoreService;

  constructor(
    public appService: AppService,
    private router: Router,
    private bsModalService: BsModalService,
    private modalService: BsModalService,
    private ssmService: AppSsmService,
    private windowService: WindowService,
    private electronService: AppNativeService,
    private messageToasterService: MessageToasterService,
    public appProviderService: AppProviderService,
    private awsAuthenticationService: AppAwsAuthenticationService,
    public optionService: OptionsService
  ) {
    this.loggingService = appProviderService.logService;
    this.sessionFactory = appProviderService.sessionFactory;
    this.fileService = appProviderService.fileService;
    this.keychainService = appProviderService.keyChainService;
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.awsCoreService = appProviderService.awsCoreService;
    this.azureCoreService = appProviderService.azureCoreService;
  }

  ngOnInit(): void {
    // Retrieve the singleton service for the concrete implementation of SessionService
    this.sessionService = this.sessionFactory.getSessionService(this.session.type);

    // Set regions and locations
    this.awsRegions = this.awsCoreService.getRegions();
    const azureLocations = this.azureCoreService.getLocations();

    // Get profiles
    this.profiles = this.appProviderService.namedProfileService.getNamedProfiles().map((p) => ({ label: p.name, value: p.id }));

    // Array and labels for regions and locations
    this.regionOrLocations = this.session.type !== SessionType.azure ? this.awsRegions : azureLocations;
    this.placeholder = this.session.type !== SessionType.azure ? "Select a default region" : "Select a default location";

    // Pre-selected Region and Profile
    this.selectedDefaultRegion = this.session.region;
    this.selectedProfile = this.getProfileId(this.session);
  }

  async applyPluginAction($event: MouseEvent, plugin: AwsCredentialsPlugin): Promise<void> {
    await plugin.run(this.session);
    /*if (plugin.templateStructure.output) {
      if (plugin.templateStructure.output.type === TemplateOutputObject.message) {
        this.appProviderService.logService.log(new LoggedEntry(plugin[plugin.templateStructure.output.data](), this, LogLevel.info, true));
      }
    }*/
  }

  /**
   * Used to call for start or stop depending on sessions status
   */
  switchCredentials(): void {
    if (this.session.status === SessionStatus.active) {
      this.stopSession();
    } else {
      this.startSession();
    }
  }

  openOptionBar(session: Session): void {
    this.clearOptionIds();
    optionBarIds[session.sessionId] = true;
    document.querySelector(".sessions").classList.add("option-bar-opened");
  }

  /**
   * Start the selected sessions
   */
  startSession(): void {
    this.sessionService.start(this.session.sessionId).then(() => {
      this.clearOptionIds();
    });
    this.logSessionData(this.session, `Starting Session`);
    this.trigger.closeMenu();
    document.querySelector(".table thead tr").scrollIntoView();
  }

  /**
   * Stop sessions
   */
  stopSession(): void {
    this.sessionService.stop(this.session.sessionId).then(() => {
      this.clearOptionIds();
      this.logSessionData(this.session, `Stopped Session`);
      this.trigger.closeMenu();
    });
  }

  /**
   * Delete a sessions from the workspace
   *
   * @param session - the sessions to remove
   * @param event - for stopping propagation bubbles
   */
  deleteSession(session: Session, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();

    const dialogMessage = this.generateDeleteDialogMessage(session);

    this.windowService.confirmDialog(
      dialogMessage,
      (status) => {
        if (status === constants.confirmed) {
          this.sessionService.delete(session.sessionId).then(() => {});
          this.logSessionData(session, "Session Deleted");
          this.clearOptionIds();
        }
      },
      "Delete Session",
      "Cancel"
    );
  }

  /**
   * Edit Session
   *
   * @param session - the sessions to edit
   * @param event - to remove propagation bubbles
   */
  editSession(session: Session, event: Event): void {
    this.clearOptionIds();
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();

    this.bsModalService.show(EditDialogComponent, {
      animated: false,
      class: "edit-modal",
      initialState: { selectedSessionId: session.sessionId },
    });
  }

  /**
   * Copy credentials in the clipboard
   */
  async copyCredentials(session: Session, type: number, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();

    try {
      if (this.appProviderService.workspaceService.workspaceExists()) {
        const texts = {
          // eslint-disable-next-line max-len
          1: (session as AwsIamRoleFederatedSession).roleArn
            ? `${(session as AwsIamRoleFederatedSession).roleArn.split("/")[0].substring(13, 25)}`
            : "",
          2: (session as AwsIamRoleFederatedSession).roleArn ? `${(session as AwsIamRoleFederatedSession).roleArn}` : "",
        };

        let text = texts[type];

        // Special conditions for IAM Users
        if (session.type === SessionType.awsIamUser) {
          // Get Account from Caller Identity
          text = await (this.sessionService as AwsIamUserService).getAccountNumberFromCallerIdentity(session);
        }

        this.appService.copyToClipboard(text);
        this.messageToasterService.toast("Your information has been successfully copied!", ToastLevel.success, "Information copied!");
      }
    } catch (err) {
      this.messageToasterService.toast(err, ToastLevel.warn);
      this.loggingService.log(new LoggedException(err, this, LogLevel.error, true, err.stack));
    }
  }

  /**
   * Copy AWS Web Console URL in the clipboard
   */
  async copyAwsWebConsoleUrl(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();

    try {
      const credentials = await (this.sessionService as AwsSessionService).generateCredentials(this.session.sessionId);
      const sessionRegion = this.session.region;
      const loginURL = await this.appProviderService.webConsoleService.getWebConsoleUrl(credentials, sessionRegion);

      this.appService.copyToClipboard(loginURL);
      this.messageToasterService.toast("Your information has been successfully copied!", ToastLevel.success, "Information copied!");
    } catch (err) {
      this.messageToasterService.toast(err, ToastLevel.warn);
      this.loggingService.log(new LoggedException(err, this, LogLevel.error, true, err.stack));
    }
  }

  logoutFromFederatedSession(): void {
    this.awsAuthenticationService.logoutFromFederatedSession(this.session, () => {
      this.clearOptionIds();
      this.logSessionData(this.session, `Stopped Session`);
      this.trigger.closeMenu();
    });
  }

  // ============================== //
  // ========== SSM AREA ========== //
  // ============================== //
  addNewProfile(tag: string): { id: string; name: string } {
    return { id: uuid.v4(), name: tag };
  }

  /**
   * SSM Modal open given the correct sessions
   *
   * @param event - event from click to stop before continuing
   */
  ssmModalOpen(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();

    // Reset things before opening the modal
    this.instances = [];
    this.ssmLoading = false;
    this.firstTimeSsm = true;
    this.selectedSsmRegion = null;
    this.modalRef = this.modalService.show(this.ssmModalTemplate, { class: "ssm-modal" });
  }

  /**
   * SSM Modal open given the correct sessions
   *
   */
  changeRegionModalOpen(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();

    // open the modal
    this.modalRef = this.modalService.show(this.defaultRegionModalTemplate, { class: "ssm-modal" });
  }

  /**
   * Set the region for ssm init and launch the mopethod form the server to find instances
   *
   * @param event - the change select event
   * @param session - The sessions in which the aws region need to change
   */
  async changeSsmRegion(event: Event, session: Session): Promise<void> {
    // We have a valid SSM region
    if (this.selectedSsmRegion) {
      // Start process
      this.ssmLoading = true;
      this.firstTimeSsm = true;
      // Generate valid temporary credentials for the SSM and EC2 client
      const credentials = await (this.sessionService as AwsSessionService).generateCredentials(session.sessionId);
      // Get the instances
      try {
        this.instances = await this.ssmService.getSsmInstances(credentials, this.selectedSsmRegion);
        this.duplicateInstances = this.instances;
      } catch (err) {
        throw new LeappBaseError("SSM Error", this, LogLevel.error, err.message);
      } finally {
        this.ssmLoading = false;
        this.firstTimeSsm = false;
      }
    }
  }

  /**
   * Set the region for the sessions
   */
  async changeRegion(): Promise<void> {
    if (this.selectedDefaultRegion) {
      let wasActive = false;

      if (this.session.status === SessionStatus.active) {
        // Stop temporary if the sessions is active
        await this.sessionService.stop(this.session.sessionId);
        wasActive = true;
      }

      const sessions: Session[] = this.appProviderService.sessionManagementService.getSessions();
      for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].sessionId === this.session.sessionId) {
          sessions[i].region = this.selectedDefaultRegion;
        }
      }
      this.appProviderService.sessionManagementService.updateSessions(sessions);
      this.behaviouralSubjectService.setSessions(this.appProviderService.sessionManagementService.getSessions());

      this.session.region = this.selectedDefaultRegion;

      if (wasActive) {
        this.startSession();
      }

      this.messageToasterService.toast("Default region has been changed!", ToastLevel.success, "Region changed!");
      this.modalRef.hide();
    }
  }

  /**
   * Start a new ssm sessions
   *
   * @param sessionId - id of the sessions
   * @param instanceId - instance id to start ssm sessions
   */
  async startSsmSession(sessionId: string, instanceId: string): Promise<void> {
    this.instances.forEach((instance) => {
      if (instance.InstanceId === instanceId) {
        instance.loading = true;
      }
    });

    // Generate valid temporary credentials for the SSM and EC2 client
    const credentials = await (this.sessionService as AwsSessionService).generateCredentials(sessionId);

    this.ssmService.startSession(credentials, instanceId, this.selectedSsmRegion);

    setTimeout(() => {
      this.instances.forEach((instance) => {
        if (instance.InstanceId === instanceId) {
          instance.loading = false;
        }
      });
    }, 4000);

    this.openSsm = false;
    this.ssmLoading = false;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  searchSSMInstance(event): void {
    if (event.target.value !== "") {
      this.instances = this.duplicateInstances.filter(
        (i) =>
          i.InstanceId.indexOf(event.target.value) > -1 || i.IPAddress.indexOf(event.target.value) > -1 || i.Name.indexOf(event.target.value) > -1
      );
    } else {
      this.instances = this.duplicateInstances;
    }
  }

  getProfileId(session: Session): string {
    if (session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      return undefined;
    }
  }

  getProfileName(profileId: string): string {
    let profileName = constants.defaultAwsProfileName;
    try {
      profileName = this.appProviderService.namedProfileService.getProfileName(profileId);
    } catch (e) {}
    return profileName;
  }

  async changeProfile(): Promise<void> {
    if (this.selectedProfile) {
      try {
        this.appProviderService.namedProfileService.getProfileName(this.selectedProfile.value);
      } catch (e) {
        this.selectedProfile.value = this.appProviderService.namedProfileService.createNamedProfile(this.selectedProfile.label).id;
      }

      this.appProviderService.namedProfileService.changeNamedProfile(this.session, this.selectedProfile.value);

      this.messageToasterService.toast("Profile has been changed!", ToastLevel.success, "Profile changed!");
      this.modalRef.hide();
    }
  }

  changeProfileModalOpen(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.profiles = this.appProviderService.namedProfileService.getNamedProfiles().map((el) => ({ value: el.id, label: el.name }));
    this.trigger.closeMenu();
    this.selectedProfile = null;
    this.modalRef = this.modalService.show(this.defaultProfileModalTemplate, { class: "ssm-modal" });
  }

  goBack(): void {
    this.modalRef.hide();
  }

  getSessionTypeIcon(type: SessionType): string {
    return type === SessionType.azure ? "azure" : "aws";
  }

  getSessionProviderClass(type: SessionType): string {
    switch (type) {
      case SessionType.azure:
        return "blue";
      case SessionType.awsIamUser:
        return "orange";
      case SessionType.awsSsoRole:
        return "red";
      case SessionType.awsIamRoleFederated:
        return "green";
      case SessionType.awsIamRoleChained:
        return "purple";
    }
  }

  getSessionProviderLabel(type: SessionType): string {
    switch (type) {
      case SessionType.azure:
        return "Azure";
      case SessionType.awsIamUser:
        return "IAM User";
      case SessionType.awsSsoRole:
        return "AWS Single Sign-On";
      case SessionType.awsIamRoleFederated:
        return "IAM Role Federated";
      case SessionType.awsIamRoleChained:
        return "IAM Role Chained";
    }
  }

  copyProfile(profileName: string): void {
    this.appService.copyToClipboard(profileName);
    this.messageToasterService.toast("Profile name copied!", ToastLevel.success, "Information copied!");
    this.trigger.closeMenu();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  openContextMenu(event: any, session: Session): void {
    this.clearOptionIds();
    optionBarIds[session.sessionId] = true;
    this.appService.closeAllMenuTriggers();

    setTimeout(() => {
      this.menuY = event.layerY - 10;
      this.menuX = event.layerX - 10;

      this.trigger.openMenu();
      this.appService.setMenuTrigger(this.trigger);
    }, 100);
  }

  pinSession(session: Session, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.optionService.pinSession(session);
    this.trigger.closeMenu();
  }

  unpinSession(session: Session, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.optionService.unpinSession(session);
    this.trigger.closeMenu();
  }

  clearOptionIds(): void {
    for (const prop of Object.getOwnPropertyNames(optionBarIds)) {
      optionBarIds[prop] = false;
    }
    document.querySelector(".sessions").classList.remove("option-bar-opened");
  }

  addNewUUID(): string {
    return uuid.v4();
  }

  async openAwsWebConsole(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.trigger.closeMenu();
    const credentials = await (this.sessionService as AwsSessionService).generateCredentials(this.session.sessionId);
    const sessionRegion = this.session.region;
    await this.appProviderService.webConsoleService.openWebConsole(credentials, sessionRegion);
  }

  createAChainedSessionFromSelectedOne(): void {
    const aliasConstructed = `ChainedFrom${this.session.sessionName}`;
    const regionConstructed = this.session.region;
    const assumerSessionIdConstructed = this.session.sessionId;
    const assumerSessionNameConstructed = this.session.sessionName;
    const sessionName = this.session.sessionName.replace(/ /g, "-");
    const assumerSessionTagConstructed = `chained-from-${sessionName}`;

    const initialState = {
      shortcutAlias: aliasConstructed,
      shortcutRegion: regionConstructed,
      shortcutSessionId: assumerSessionIdConstructed,
      shortcutSessionName: assumerSessionNameConstructed,
      shortcutSessionTag: assumerSessionTagConstructed,
      shortcut: true,
    };

    this.bsModalService.show(CreateDialogComponent, {
      animated: false,
      class: "create-modal",
      backdrop: "static",
      keyboard: false,
      initialState,
    });
  }

  private logSessionData(session: Session, message: string): void {
    this.loggingService.log(
      new LoggedEntry(
        message,
        this,
        LogLevel.info,
        false,
        JSON.stringify({ timestamp: new Date().toISOString(), id: session.sessionId, account: session.sessionName, type: session.type }, null, 3)
      )
    );
  }

  private generateDeleteDialogMessage(session: Session): string {
    let iamRoleChainedSessions = [];
    if (session.type !== SessionType.azure) {
      iamRoleChainedSessions = this.appProviderService.sessionManagementService.getIamRoleChained(session);
    }

    let iamRoleChainedSessionString = "";
    iamRoleChainedSessions.forEach((sess) => {
      iamRoleChainedSessionString += `<li><div class="removed-sessions"><b>${sess.sessionName}</b></div></li>`;
    });
    if (iamRoleChainedSessionString !== "") {
      return (
        "This sessions has iamRoleChained sessions: <br><ul>" +
        iamRoleChainedSessionString +
        // eslint-disable-next-line max-len
        "</ul><br>Removing the sessions will also remove the iamRoleChained sessions associated with it. Do you want to proceed?"
      );
    } else {
      return `Do you really want to delete the session '${session.sessionName}'?`;
    }
  }
}
