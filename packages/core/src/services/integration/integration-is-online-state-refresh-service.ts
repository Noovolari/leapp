import { AwsSsoIntegrationService } from "./aws-sso-integration-service";
import { AzureIntegrationService } from "./azure-integration-service";
import { BehaviouralSubjectService } from "../behavioural-subject-service";

export class IntegrationIsOnlineStateRefreshService {
  constructor(
    private awsSsoIntegrationService: AwsSsoIntegrationService,
    private azureIntegrationService: AzureIntegrationService,
    private behaviouralSubjectService: BehaviouralSubjectService
  ) {}

  async refreshIsOnlineState(): Promise<void> {
    const awsSsoIntegrations = this.awsSsoIntegrationService.getIntegrations();
    const azureIntegrations = this.azureIntegrationService.getIntegrations();

    const promises: Promise<void>[] = [];

    for (const awsSsoIntegration of awsSsoIntegrations) {
      promises.push(this.awsSsoIntegrationService.setOnline(awsSsoIntegration));
    }

    for (const azureIntegration of azureIntegrations) {
      promises.push(this.azureIntegrationService.setOnline(azureIntegration));
    }

    await Promise.all(promises);

    const updatedAwsSsoIntegrations = this.awsSsoIntegrationService.getIntegrations();
    const updatedAzureIntegrations = this.azureIntegrationService.getIntegrations();

    this.behaviouralSubjectService.setIntegrations([...updatedAwsSsoIntegrations, ...updatedAzureIntegrations]);
  }
}
