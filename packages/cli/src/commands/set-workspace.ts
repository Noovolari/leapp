import { LeappCommand } from "../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Args } from "@oclif/core";
import { constants } from "@noovolari/leapp-core/models/constants";

interface WorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
}

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
        const workspace = await this.getWorkspaceByName(args.workspaceName);
        await this.setWorkspace(workspace);
      } else {
        const workspace = await this.getWorkspaceInteractively();
        await this.setWorkspace(workspace);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  private async getWorkspaceByName(workspaceName: string): Promise<WorkspaceInfo> {
    const signedInUser = this.cliProviderService.teamService.signedInUserState?.getValue();
    if (signedInUser && workspaceName.toLowerCase() === signedInUser.teamName.toLowerCase()) {
      //TODO: when we are going to implement multiple teams, we'll need to retrieve the correct one
      return { workspaceId: signedInUser.teamId, workspaceName: signedInUser.teamName };
    } else if (
      workspaceName.toLowerCase() === constants.localWorkspaceKeychainValue.toLowerCase() ||
      workspaceName.toLowerCase() === constants.localWorkspaceName.toLowerCase()
    ) {
      return { workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName };
    } else {
      throw new Error("the selected workspace does not exist");
    }
  }

  private async getWorkspaceInteractively(): Promise<WorkspaceInfo> {
    const signedInUser = this.cliProviderService.teamService.signedInUserState?.getValue();
    const workspaces = signedInUser
      ? [{ name: signedInUser.teamName, value: { workspaceId: signedInUser.teamId, workspaceName: signedInUser.teamName } }]
      : [];
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedWorkspace",
        message: "select a workspace",
        type: "list",
        choices: [
          {
            name: `${constants.localWorkspaceName} (${constants.localWorkspaceKeychainValue})`,
            value: { workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName },
          },
          ...workspaces,
        ],
      },
    ]);
    return answer.selectedWorkspace;
  }

  private async setWorkspace(workspace: WorkspaceInfo) {
    if (workspace.workspaceId === constants.localWorkspaceKeychainValue) {
      await this.cliProviderService.teamService.switchToLocalWorkspace();
    } else {
      //TODO: with multiple workspace, this method this will call setRemoteWorkspace(workspaceId)
      await this.cliProviderService.teamService.pullFromRemote(false);
    }
    this.log(`workspace ${workspace.workspaceName} set correctly`);
    await this.cliProviderService.remoteProceduresClient.refreshWorkspaceState();
  }
}
