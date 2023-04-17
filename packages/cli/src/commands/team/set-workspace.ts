import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Args } from "@oclif/core";
import { constants } from "@noovolari/leapp-core/models/constants";

export default class SetWorkspace extends LeappCommand {
  static description = "Set the current Leapp workspace";

  static examples = ["$leapp team set-workspace", "$leapp team set-workspace local", "$leapp team set-workspace WORKSPACE-NAME"];

  static args = {
    workspaceName: Args.string({ description: "name of the Leapp Team remote workspace or local", required: false }),
  };

  static flags = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args } = await this.parse(SetWorkspace);
      if (args.workspaceName !== undefined) {
        const workspaceId = await this.getWorkspaceIdByName(args.workspaceName);
        await this.setWorkspace(workspaceId);
      } else {
        const workspaceId = await this.getWorkspaceIdInteractively();
        await this.setWorkspace(workspaceId);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  private async getWorkspaceIdByName(workspaceName: string): Promise<string> {
    const signedInUser = this.cliProviderService.teamService.signedInUserState?.getValue();
    if (signedInUser && workspaceName === signedInUser.teamName) {
      //TODO: when we are going to implement multiple teams, we'll need to retrieve the correct one
      return signedInUser.teamId;
    } else if (workspaceName === constants.localWorkspaceKeychainValue) {
      return constants.localWorkspaceKeychainValue;
    } else {
      throw new Error("the selected workspace does not exist");
    }
  }

  private async getWorkspaceIdInteractively(): Promise<string> {
    const signedInUser = this.cliProviderService.teamService.signedInUserState?.getValue();
    const workspaces = signedInUser ? [{ name: signedInUser.teamName, value: signedInUser.teamId }] : [];
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedWorkspaceId",
        message: "select a workspace",
        type: "list",
        choices: [
          {
            name: constants.localWorkspaceName,
            value: constants.localWorkspaceKeychainValue,
          },
          ...workspaces,
        ],
      },
    ]);
    return answer.selectedWorkspaceId;
  }

  private async setWorkspace(workspaceId: string) {
    if (workspaceId === constants.localWorkspaceKeychainValue) {
      await this.cliProviderService.teamService.switchToLocalWorkspace();
    } else {
      //TODO: with multiple workspace, this method this will call setRemoteWorkspace(workspaceId)
      await this.cliProviderService.teamService.syncSecrets();
    }
    this.log("workspace set correctly");
    await this.cliProviderService.remoteProceduresClient.refreshWorkspaceState();
  }
}
