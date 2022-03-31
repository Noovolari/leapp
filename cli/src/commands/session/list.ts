import { CliUx } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { LeappCommand } from "../../leapp-command";

export default class ListSessions extends LeappCommand {
  static description = "Show sessions list";
  static examples = [`$leapp session list`];

  static flags = {
    ...CliUx.ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showSessions();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showSessions(): Promise<void> {
    const { flags } = await this.parse(ListSessions);
    const sessionTypeLabelMap = this.cliProviderService.cloudProviderService.getSessionTypeMap();
    const namedProfilesMap = this.cliProviderService.namedProfilesService.getNamedProfilesMap();
    const data = this.cliProviderService.repository.getSessions().map((session) => ({
      sessionName: session.sessionName,
      type: sessionTypeLabelMap.get(session.type),
      profileId: "profileId" in session ? namedProfilesMap.get((session as any).profileId)?.name : "-",
      region: session.region,
      status: SessionStatus[session.status],
    })) as any as Record<string, unknown>[];

    const columns = {
      sessionName: { header: "Session Name" },
      type: { header: "Type" },
      profileId: { header: "Named Profile" },
      region: { header: "Region/Location" },
      status: { header: "Status" },
    };

    CliUx.ux.table(data, columns, { ...flags });
  }
}
