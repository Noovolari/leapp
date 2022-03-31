import { Command } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { CliProviderService } from "./service/cli-provider-service";

export abstract class LeappCommand extends Command {
  protected constructor(argv: string[], config: Config, protected cliProviderService = new CliProviderService()) {
    super(argv, config);
  }

  async init(): Promise<void> {
    this.cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate(this.cliProviderService.awsSsoIntegrationService);
    const isDesktopAppRunning = await this.cliProviderService.remoteProceduresClient.isDesktopAppRunning();
    if (!isDesktopAppRunning) {
      this.error("Leapp app must be running to use this CLI. You can download it here: https://www.leapp.cloud/releases");
    }
  }
}
