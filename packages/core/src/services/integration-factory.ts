import { AwsSsoIntegrationService } from "./integration/aws-sso-integration-service";
import { AzureIntegrationService } from "./integration/azure-integration-service";
import { IIntegrationService } from "../interfaces/i-integration-service";
import { IntegrationType } from "../models/integration-type";
import { IntegrationParams } from "../models/integration-params";
import { AzureIntegrationCreationParams } from "../models/azure/azure-integration-creation-params";
import { Integration } from "../models/integration";

export class IntegrationFactory {
  constructor(
    private readonly awsSsoIntegrationService: AwsSsoIntegrationService,
    private readonly azureIntegrationService: AzureIntegrationService
  ) {}

  getIntegrationService(integrationType: IntegrationType): IIntegrationService {
    switch (integrationType) {
      case IntegrationType.awsSso:
        return this.awsSsoIntegrationService;
      case IntegrationType.azure:
        return this.azureIntegrationService;
    }
  }

  async create(integrationType: IntegrationType, creationParams: IntegrationParams): Promise<void> {
    const integrationService = this.getIntegrationService(integrationType);
    await integrationService.createIntegration(creationParams);
  }

  async update(integrationId: string, updateParams: IntegrationParams): Promise<void> {
    const integrationType = this.getIntegrationById(integrationId)?.type;
    if (integrationType === IntegrationType.azure) {
      const currentIntegration = this.azureIntegrationService.getIntegration(integrationId);
      if (currentIntegration.tenantId !== (updateParams as AzureIntegrationCreationParams).tenantId) {
        await this.azureIntegrationService.logout(integrationId);
      }
    }
    const integrationService = this.getIntegrationService(integrationType);
    await integrationService.updateIntegration(integrationId, updateParams);
  }

  async delete(integrationId: string): Promise<void> {
    const integrationType = this.getIntegrationById(integrationId)?.type;
    const integrationService = this.getIntegrationService(integrationType);
    await integrationService.deleteIntegration(integrationId);
  }

  async syncSessions(integrationId: string): Promise<any> {
    const integrationType = this.getIntegrationById(integrationId)?.type;
    const integrationService = this.getIntegrationService(integrationType);
    return await integrationService.syncSessions(integrationId);
  }

  async logout(integrationId: string): Promise<void> {
    const integrationType = this.getIntegrationById(integrationId)?.type;
    const integrationService = this.getIntegrationService(integrationType);
    await integrationService.logout(integrationId);
  }

  getRemainingHours(integration: Integration): string {
    const integrationType = this.getIntegrationById(integration.id)?.type;
    const integrationService = this.getIntegrationService(integrationType);
    if (integrationType && integrationService) {
      return integrationService.remainingHours(integration);
    } else {
      return "";
    }
  }

  async setOnline(integration: Integration): Promise<void> {
    const integrationType = this.getIntegrationById(integration.id)?.type;
    const integrationService = this.getIntegrationService(integrationType);
    await integrationService.setOnline(integration);
  }

  getIntegrations(): Integration[] {
    return [...this.awsSsoIntegrationService.getIntegrations(), ...this.azureIntegrationService.getIntegrations()];
  }

  getIntegrationById(integrationId: string): Integration {
    return this.getIntegrations().find((integration) => integration.id === integrationId);
  }
}
