import { BehaviouralSubjectService } from "../behavioural-subject-service";
import { IntegrationFactory } from "../integration-factory";

export class IntegrationIsOnlineStateRefreshService {
  constructor(private integrationFactory: IntegrationFactory, private behaviouralSubjectService: BehaviouralSubjectService) {}

  async refreshIsOnlineState(): Promise<void> {
    const integrations = this.integrationFactory.getIntegrations();
    await Promise.all(integrations.map((integration) => this.integrationFactory.setOnline(integration)));
    this.behaviouralSubjectService.setIntegrations(this.integrationFactory.getIntegrations());
  }
}
