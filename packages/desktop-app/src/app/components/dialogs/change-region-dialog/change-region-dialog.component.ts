import { Component, Input, OnInit } from "@angular/core";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { AwsCoreService } from "@noovolari/leapp-core/services/aws-core-service";
import { AzureCoreService } from "@noovolari/leapp-core/services/azure-core-service";
import { Session } from "@noovolari/leapp-core/models/session";
import { RegionsService } from "@noovolari/leapp-core/services/regions-service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";

@Component({
  selector: "app-change-region-dialog",
  templateUrl: "./change-region-dialog.component.html",
  styleUrls: ["./change-region-dialog.component.scss"],
})
export class ChangeRegionDialogComponent implements OnInit {
  @Input()
  public session: Session;

  public eSessionType = SessionType;
  public regionOrLocations = [];
  public selectedRegion: any;
  public placeholder: string;

  private awsCoreService: AwsCoreService;
  private azureCoreService: AzureCoreService;
  private regionService: RegionsService;

  constructor(private appService: AppService, private appProviderService: AppProviderService, private messageToasterService: MessageToasterService) {
    this.awsCoreService = appProviderService.awsCoreService;
    this.azureCoreService = appProviderService.azureCoreService;
    this.regionService = appProviderService.regionsService;
  }

  ngOnInit(): void {
    const awsRegions = this.awsCoreService.getRegions();
    const azureLocations = this.azureCoreService.getLocations();
    // Array and labels for regions and locations
    this.regionOrLocations = this.session.type !== SessionType.azure ? awsRegions : azureLocations;
    this.selectedRegion = this.session.region;
    this.placeholder = this.session.type !== SessionType.azure ? "Select a default region" : "Select a default location";
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  async changeRegion(): Promise<void> {
    await this.regionService.changeRegion(this.session, this.selectedRegion);
    this.messageToasterService.toast("Default region has been changed!", ToastLevel.success, "Region changed!");
    this.closeModal();
  }
}
