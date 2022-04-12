import { AfterViewInit, Component, Input, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { AppService } from "../../../services/app.service";
import { Router } from "@angular/router";
import { MatTabGroup } from "@angular/material/tabs";
import { constants } from "@noovolari/leapp-core/models/constants";
import { LoggerLevel } from "@noovolari/leapp-core/services/logging-service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws-iam-role-federated-session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";
import { AppProviderService } from "../../../services/app-provider.service";

@Component({
  selector: "app-options-dialog",
  templateUrl: "./options-dialog.component.html",
  styleUrls: ["./options-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class OptionsDialogComponent implements OnInit, AfterViewInit {
  @Input()
  selectedIndex;

  @ViewChild("tabs", { static: false })
  tabGroup: MatTabGroup;

  eConstants = constants;

  awsProfileValue: { id: string; name: string };
  idpUrlValue;
  editingIdpUrl: boolean;
  editingAwsProfile: boolean;

  showProxyAuthentication = false;
  proxyProtocol = "https"; // Default
  proxyUrl;
  proxyPort = "8080"; // Default
  proxyUsername;
  proxyPassword;

  locations: { location: string }[];
  regions: { region: string }[];
  selectedLocation: string;
  selectedRegion: string;
  selectedBrowserOpening = constants.inApp.toString();
  selectedTerminal;

  colorTheme: string;
  selectedColorTheme: string;

  form = new FormGroup({
    idpUrl: new FormControl(""),
    awsProfile: new FormControl(""),
    proxyUrl: new FormControl(""),
    proxyProtocol: new FormControl(""),
    proxyPort: new FormControl(""),
    proxyUsername: new FormControl(""),
    proxyPassword: new FormControl(""),
    showAuthCheckbox: new FormControl(""),
    regionsSelect: new FormControl(""),
    locationsSelect: new FormControl(""),
    defaultBrowserOpening: new FormControl(""),
    terminalSelect: new FormControl(""),
    colorThemeSelect: new FormControl(""),
  });

  /* Simple profile page: shows the Idp Url and the workspace json */
  private sessionService: SessionService;

  constructor(
    public appProviderService: AppProviderService,
    public appService: AppService,
    private windowService: WindowService,
    private toasterService: MessageToasterService,
    private router: Router
  ) {
    this.selectedTerminal = this.appProviderService.repository.getWorkspace().macOsTerminal || constants.macOsTerminal;

    this.colorTheme = this.appProviderService.repository.getWorkspace().colorTheme || constants.colorTheme;
    this.selectedColorTheme = this.colorTheme;
  }

  ngOnInit(): void {
    this.idpUrlValue = "";
    this.proxyProtocol = this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyProtocol;
    this.proxyUrl = this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyUrl;
    this.proxyPort = this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyPort;
    this.proxyUsername = this.appProviderService.repository.getWorkspace().proxyConfiguration.username || "";
    this.proxyPassword = this.appProviderService.repository.getWorkspace().proxyConfiguration.password || "";

    this.form.controls["idpUrl"].setValue(this.idpUrlValue);
    this.form.controls["proxyUrl"].setValue(this.proxyUrl);
    this.form.controls["proxyProtocol"].setValue(this.proxyProtocol);
    this.form.controls["proxyPort"].setValue(this.proxyPort);
    this.form.controls["proxyUsername"].setValue(this.proxyUsername);
    this.form.controls["proxyPassword"].setValue(this.proxyPassword);

    const isProxyUrl =
      this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyUrl &&
      this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyUrl !== "undefined";
    this.proxyUrl = isProxyUrl ? this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyUrl : "";

    if (this.proxyUsername || this.proxyPassword) {
      this.showProxyAuthentication = true;
    }

    this.regions = this.appProviderService.awsCoreService.getRegions();
    this.locations = this.appProviderService.azureCoreService.getLocations();
    this.selectedRegion = this.appProviderService.repository.getWorkspace().defaultRegion || constants.defaultRegion;
    this.selectedLocation = this.appProviderService.repository.getWorkspace().defaultLocation || constants.defaultLocation;

    this.appService.validateAllFormFields(this.form);
  }

  ngAfterViewInit(): void {
    if (this.selectedIndex) {
      this.tabGroup.selectedIndex = this.selectedIndex;
    }
  }

  setColorTheme(theme: string): void {
    this.appProviderService.repository.updateColorTheme(theme);
    this.colorTheme = this.appProviderService.repository.getWorkspace().colorTheme;
    this.selectedColorTheme = this.colorTheme;
    if (this.colorTheme === constants.darkTheme) {
      document.querySelector("body").classList.add("dark-theme");
    } else if (this.colorTheme === constants.lightTheme) {
      document.querySelector("body").classList.remove("dark-theme");
    } else if (this.colorTheme === constants.systemDefaultTheme) {
      document.querySelector("body").classList.toggle("dark-theme", this.appService.isDarkMode());
    }
  }

  /**
   * Save the idp-url again
   */
  saveOptions(): void {
    if (this.form.valid) {
      this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyUrl = this.form.controls["proxyUrl"].value;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyProtocol = this.form.controls["proxyProtocol"].value;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.getWorkspace().proxyConfiguration.proxyPort = this.form.controls["proxyPort"].value;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.getWorkspace().proxyConfiguration.username = this.form.controls["proxyUsername"].value;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.getWorkspace().proxyConfiguration.password = this.form.controls["proxyPassword"].value;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.updateProxyConfiguration(this.appProviderService.repository.getWorkspace().proxyConfiguration);

      this.appProviderService.repository.getWorkspace().defaultRegion = this.selectedRegion;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.updateDefaultRegion(this.appProviderService.repository.getWorkspace().defaultRegion);

      this.appProviderService.repository.getWorkspace().defaultLocation = this.selectedLocation;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.updateDefaultLocation(this.appProviderService.repository.getWorkspace().defaultLocation);

      this.appProviderService.repository.getWorkspace().macOsTerminal = this.selectedTerminal;
      // eslint-disable-next-line max-len
      this.appProviderService.repository.updateMacOsTerminal(this.appProviderService.repository.getWorkspace().macOsTerminal);

      if (this.checkIfNeedDialogBox()) {
        // eslint-disable-next-line max-len
        this.windowService.confirmDialog(
          "You've set a proxy url: the app must be restarted to update the configuration.",
          (res) => {
            if (res !== constants.confirmClosed) {
              // eslint-disable-next-line max-len
              this.appProviderService.loggingService.logger(
                "User have set a proxy url: the app must be restarted to update the configuration.",
                LoggerLevel.info,
                this
              );
              this.appService.restart();
            }
          },
          "Restart",
          "Cancel"
        );
      } else {
        this.appService.closeModal();
        this.appProviderService.loggingService.logger("Option saved.", LoggerLevel.info, this, JSON.stringify(this.form.getRawValue(), null, 3));
        this.toasterService.toast("Option saved.", ToastLevel.info, "Options");
      }
    }
  }

  /**
   * Check if we need a dialog box to request restarting the application
   */
  checkIfNeedDialogBox(): boolean {
    return (
      this.form.controls["proxyUrl"].value !== undefined &&
      this.form.controls["proxyUrl"].value !== null &&
      (this.form.controls["proxyUrl"].dirty ||
        this.form.controls["proxyProtocol"].dirty ||
        this.form.controls["proxyPort"].dirty ||
        this.form.controls["proxyUsername"].dirty ||
        this.form.controls["proxyPassword"].dirty)
    );
  }

  /**
   * Return to home screen
   */
  goBack(): void {
    this.router.navigate(["/dashboard"]).then(() => {});
  }

  manageIdpUrl(id: string): void {
    const idpUrl = this.appProviderService.repository.getIdpUrl(id);
    const validate = this.appProviderService.idpUrlService.validateIdpUrl(this.form.get("idpUrl").value);
    if (validate === true) {
      if (!idpUrl) {
        this.appProviderService.idpUrlService.createIdpUrl(this.form.get("idpUrl").value);
      } else {
        this.appProviderService.idpUrlService.editIdpUrl(id, this.form.get("idpUrl").value);
      }
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get("idpUrl").setValue("");
  }

  editIdpUrl(id: string): void {
    const idpUrl = this.appProviderService.idpUrlService.getIdpUrls().filter((u) => u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get("idpUrl").setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  deleteIdpUrl(id: string): void {
    // Assumable sessions with this id
    /// this.sessionService = this.leappCoreService.sessionFactory.getSessionService(SessionType.awsIamRoleFederated);
    // let sessions = this.leappCoreService.repository.getSessions().filter((s) => (s as AwsIamRoleFederatedSession).idpUrlId === id);

    // Add iam Role Chained from iam role iam_federated_role
    // sessions.forEach((parent) => {
    //  const childs = this.leappCoreService.repository.listIamRoleChained(parent);
    //  sessions = sessions.concat(childs);
    // });

    const sessions = this.appProviderService.idpUrlService.getDependantSessions(id);

    // Get only names for display
    let sessionsNames = sessions.map(
      (s) =>
        `<li>
            <div class="removed-sessions">
            <b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn.split("/")[1]}</small>
            </div>
      </li>`
    );

    if (sessionsNames.length === 0) {
      sessionsNames = ["<li><b>no sessions</b></li>"];
    }

    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this IdP URL will also remove these sessions: <br><ul>${sessionsNames.join("")}</ul>Do you want to proceed?`,
      (res) => {
        if (res !== constants.confirmClosed) {
          this.appProviderService.loggingService.logger(`Removing idp url with id: ${id}`, LoggerLevel.info, this);

          sessions.forEach((session) => {
            this.appProviderService.repository.deleteSession(session.sessionId);
            this.appProviderService.workspaceService.deleteSession(session.sessionId);
          });
          this.appProviderService.idpUrlService.deleteIdpUrl(id);
        }
      },
      "Delete IdP URL",
      "Cancel"
    );
  }

  async manageAwsProfile(id: string | number): Promise<void> {
    const profileIndex = this.appProviderService.repository.getWorkspace().profiles.findIndex((p) => p.id === id.toString());

    const validate = this.appProviderService.namedProfileService.validateNewProfileName(this.form.get("awsProfile").value);
    if (validate === true) {
      if (profileIndex === -1) {
        this.appProviderService.namedProfileService.createNamedProfile(this.form.get("awsProfile").value);
      } else {
        this.appProviderService.namedProfileService.editNamedProfile(id.toString(), this.form.get("awsProfile").value);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < this.appProviderService.workspaceService.sessions.length; i++) {
          const sess = this.appProviderService.workspaceService.sessions[i];
          this.sessionService = this.appProviderService.sessionFactory.getSessionService(sess.type);

          if ((sess as any).profileId === id.toString()) {
            if ((sess as any).status === SessionStatus.active) {
              await this.sessionService.stop(sess.sessionId);
              await this.sessionService.start(sess.sessionId);
            }
          }
        }
      }
    } else {
      this.toasterService.toast(validate.toString(), ToastLevel.warn);
    }

    this.editingAwsProfile = false;
    this.awsProfileValue = undefined;
    this.form.get("awsProfile").setValue("");
  }

  editAwsProfile(id: string): void {
    const profile = this.appProviderService.namedProfileService.getNamedProfiles(false).filter((u) => u.id === id)[0];
    this.awsProfileValue = profile;
    this.form.get("awsProfile").setValue(profile.name);
    this.editingAwsProfile = true;
  }

  deleteAwsProfile(id: string): void {
    // With profile
    const sessions = this.appProviderService.repository.getSessions().filter((sess) => (sess as any).profileId === id);

    // Get only names for display
    let sessionsNames = sessions.map(
      (s) =>
        `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${
          (s as AwsIamRoleFederatedSession).roleArn ? (s as AwsIamRoleFederatedSession).roleArn.split("/")[1] : ""
        }</small></div></li>`
    );
    if (sessionsNames.length === 0) {
      sessionsNames = ["<li><b>no sessions</b></li>"];
    }

    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this profile will set default to these sessions: <br><ul>${sessionsNames.join("")}</ul>Do you want to proceed?`,
      async (res) => {
        if (res !== constants.confirmClosed) {
          this.appProviderService.loggingService.logger(`Reverting to default profile with id: ${id}`, LoggerLevel.info, this);

          // Reverting all sessions to default profile
          // eslint-disable-next-line @typescript-eslint/prefer-for-of
          for (let i = 0; i < sessions.length; i++) {
            const sess = sessions[i];
            this.sessionService = this.appProviderService.sessionFactory.getSessionService(sess.type);

            let wasActive = false;
            if ((sess as any).status === SessionStatus.active) {
              wasActive = true;
              await this.sessionService.stop(sess.sessionId);
            }

            (sess as any).profileId = this.appProviderService.repository.getDefaultProfileId();

            this.appProviderService.repository.updateSession(sess.sessionId, sess);
            this.appProviderService.workspaceService.updateSession(sess.sessionId, sess);
            if (wasActive) {
              this.sessionService.start(sess.sessionId);
            }
          }

          this.appProviderService.namedProfileService.deleteNamedProfile(id);
        }
      },
      "Delete Profile",
      "Cancel"
    );
  }

  openJoinUs(): void {
    this.windowService.openExternalUrl("https://join.slack.com/t/noovolari/shared_invite/zt-noc0ju05-18_GRX~Zi6Jz8~95j5CySA");
  }
}
