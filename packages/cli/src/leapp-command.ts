import { Command } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { CliProviderService } from "./service/cli-provider-service";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { Session } from "@noovolari/leapp-core/models/session";

export abstract class LeappCommand extends Command {
  protected constructor(argv: string[], config: Config, protected cliProviderService = new CliProviderService()) {
    super(argv, config);
  }

  protected static areFlagsNotDefined(flags: any, instance: any): boolean {
    let enableInteractiveMode = true;
    Object.keys(flags).forEach((key) => {
      if (Object.keys(instance.constructor.flags).includes(key)) {
        //if the command contains at least a flag, do not switch to interactive mode
        if (flags[key] !== undefined) {
          enableInteractiveMode = false;
        }
      }
    });
    return enableInteractiveMode;
  }

  async init(): Promise<void> {
    this.cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate(this.cliProviderService.awsSsoIntegrationService);
    const isDesktopAppRunning = await this.cliProviderService.remoteProceduresClient.isDesktopAppRunning();
    if (!isDesktopAppRunning) {
      this.error("Leapp app must be running to use this CLI. You can download it here: https://www.leapp.cloud/releases");
      return;
    }
    await this.cliProviderService.teamService.setCurrentWorkspace(true);
  }

  unsupportedAzureSession(session: Session): void {
    if (session && session.type === SessionType.azure) {
      throw new Error("Azure sessions not supported for this command");
    }
  }
}
