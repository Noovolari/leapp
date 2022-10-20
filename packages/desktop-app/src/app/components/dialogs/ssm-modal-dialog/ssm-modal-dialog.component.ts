import { Component, Input, OnInit } from "@angular/core";
import { Session } from "@noovolari/leapp-core/models/session";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { SsmService } from "@noovolari/leapp-core/services/ssm-service";
import { LeappBaseError } from "@noovolari/leapp-core/errors/leapp-base-error";
import { LogLevel } from "@noovolari/leapp-core/services/log-service";
import { constants } from "@noovolari/leapp-core/models/constants";

@Component({
  selector: "app-ssm-modal-dialog",
  templateUrl: "./ssm-modal-dialog.component.html",
  styleUrls: ["./ssm-modal-dialog.component.scss"],
})
export class SsmModalDialogComponent implements OnInit {
  @Input()
  public session: Session;
  public instances: any[];
  public instancesNotFiltered: any[];
  public ssmLoading: boolean;
  public askingSsmRegion: boolean;
  public selectedSsmRegion: string;
  public awsRegions: { region: string }[];

  private sessionFactory: SessionFactory;
  private ssmService: SsmService;

  constructor(private appService: AppService, private appProviderService: AppProviderService) {}

  get sessionService(): AwsSessionService {
    return this.sessionFactory.getSessionService(this.session.type) as AwsSessionService;
  }

  ngOnInit(): void {
    this.instances = [];
    this.ssmLoading = false;
    this.askingSsmRegion = true;
    this.selectedSsmRegion = null;
    this.awsRegions = this.appProviderService.awsCoreService.getRegions();
    this.sessionFactory = this.appProviderService.sessionFactory;
    this.ssmService = this.appProviderService.ssmService;

    if (this.appProviderService.repository.getWorkspace().ssmRegionBehaviour === constants.ssmRegionDefault) {
      this.selectedSsmRegion = this.session.region;
      this.changeSsmRegion();
    }
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  /**
   * Set the region for ssm init and launch the method form the server to find instances
   *
   * @param event - the change select event
   * @param session - The sessions in which the aws region need to change
   */
  async changeSsmRegion(): Promise<void> {
    // We have a valid SSM region
    if (this.selectedSsmRegion) {
      // Start process
      this.ssmLoading = true;
      this.askingSsmRegion = true;
      // Generate valid temporary credentials for the SSM and EC2 client
      const credentials = await (this.sessionService as AwsSessionService).generateCredentials(this.session.sessionId);
      // Get the instances
      try {
        this.instances = await this.ssmService.getSsmInstances(credentials, this.selectedSsmRegion);
        this.instancesNotFiltered = this.instances;
        this.askingSsmRegion = false;
      } catch (err) {
        this.instances = [];
        this.instancesNotFiltered = [];
        this.askingSsmRegion = true;
        throw new LeappBaseError("SSM Error", this, LogLevel.error, err.message);
      } finally {
        this.ssmLoading = false;
      }
    }
  }

  searchSSMInstance(event): void {
    if (event.target.value !== "") {
      this.instances = this.instancesNotFiltered.filter(
        (i) =>
          i.InstanceId.indexOf(event.target.value) > -1 || i.IPAddress.indexOf(event.target.value) > -1 || i.Name.indexOf(event.target.value) > -1
      );
    } else {
      this.instances = this.instancesNotFiltered;
    }
  }

  /**
   * Start a new ssm sessions
   *
   * @param sessionId - id of the sessions
   * @param instanceId - instance id to start ssm sessions
   */
  async startSsmSession(instanceId: string): Promise<void> {
    this.instances.forEach((instance) => {
      if (instance.InstanceId === instanceId) {
        instance.loading = true;
      }
    });

    // Generate valid temporary credentials for the SSM and EC2 client
    const credentials = await (this.sessionService as AwsSessionService).generateCredentials(this.session.sessionId);

    this.ssmService.startSession(credentials, instanceId, this.selectedSsmRegion);

    setTimeout(() => {
      this.instances.forEach((instance) => {
        if (instance.InstanceId === instanceId) {
          instance.loading = false;
        }
      });
    }, 4000);

    this.ssmLoading = false;
  }
}
