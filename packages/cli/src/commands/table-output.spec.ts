import { describe, expect, jest, test } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import ListSessions from "./session/list";
import ListProfiles from "./profile/list";
import ListIntegrations from "./integration/list";
import ListIdpUrls from "./idp-url/list";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { oclifTestConfig } from "../../test/oclif-test-config";

// Golden outputs of the four list commands, recorded before the oclif upgrade.
// Scripts parse this output, so it must stay byte-identical. Re-record only by a spec decision:
// RECORD_CLI_TABLES=1 npx jest src/commands/table-output.spec.ts
const goldenDir = path.join(__dirname, "../../test/cli-tables");
const record = process.env.RECORD_CLI_TABLES === "1";

const longName = "a-session-name-long-enough-to-be-truncated-by-a-narrow-terminal-0123456789";

const sessions = [
  {
    sessionId: "s-iam-user",
    sessionName: "dev-user",
    type: SessionType.awsIamUser,
    profileId: "p-default",
    region: "eu-west-1",
    status: SessionStatus.active,
  },
  {
    sessionId: "s-federated",
    sessionName: longName,
    type: SessionType.awsIamRoleFederated,
    roleArn: "arn:aws:iam::111111111111:role/Federated-Admin",
    profileId: "p-other",
    region: "us-east-1",
    status: SessionStatus.inactive,
  },
  {
    sessionId: "s-chained",
    sessionName: "chained",
    type: SessionType.awsIamRoleChained,
    roleArn: "arn:aws:iam::222222222222:role/Chained-Reader",
    profileId: "p-default",
    region: "eu-central-1",
    status: SessionStatus.pending,
  },
  {
    sessionId: "s-sso",
    sessionName: "sso-prod",
    type: SessionType.awsSsoRole,
    roleArn: "arn:aws:iam::333333333333/AdministratorAccess",
    profileId: "p-other",
    region: "eu-west-1",
    status: SessionStatus.inactive,
  },
  {
    sessionId: "s-azure",
    sessionName: "azure-sub",
    type: SessionType.azure,
    subscriptionId: "00000000-1111-2222-3333-444444444444",
    region: "westeurope",
    status: SessionStatus.inactive,
  },
];
const profiles = [
  { id: "p-default", name: "default" },
  { id: "p-other", name: "other-profile" },
];
const integrations = [
  {
    id: "i-sso",
    type: IntegrationType.awsSso,
    alias: "company-sso",
    portalUrl: "https://example.awsapps.com/start",
    region: "eu-west-1",
    isOnline: true,
  },
  {
    id: "i-azure",
    type: IntegrationType.azure,
    alias: "company-azure",
    tenantId: "99999999-8888-7777-6666-555555555555",
    location: "westeurope",
    isOnline: false,
  },
];
const idpUrls = [
  { id: "u-1", url: "https://idp.example.com/saml/login" },
  { id: "u-2", url: `https://idp.example.com/very/long/path/${"x".repeat(80)}` },
];

const cliProviderService = {
  sessionManagementService: { getSessions: () => sessions },
  cloudProviderService: {
    getSessionTypeMap: () =>
      new Map([
        [SessionType.awsIamUser, "IAM User"],
        [SessionType.awsIamRoleFederated, "IAM Role Federated"],
        [SessionType.awsIamRoleChained, "IAM Role Chained"],
        [SessionType.awsSsoRole, "AWS Single Sign-On"],
        [SessionType.azure, "Azure"],
      ]),
  },
  namedProfilesService: {
    getNamedProfilesMap: () => new Map(profiles.map((p) => [p.id, p])),
    getNamedProfiles: () => profiles,
  },
  integrationFactory: {
    getIntegrations: () => integrations,
    getRemainingHours: () => "in 7 hours",
  },
  idpUrlsService: { getIdpUrls: () => idpUrls },
};

const commands: [string, any, string, string, string][] = [
  // name, class, a column header, a sort header, a filter
  ["session-list", ListSessions, "Session Name,Status", "Session Name", "Type=IAM"],
  ["profile-list", ListProfiles, "Profile Name", "-Profile Name", "Profile Name=other"],
  ["integration-list", ListIntegrations, "Integration Name,Status", "-Integration Name", "Status=Online"],
  ["idp-url-list", ListIdpUrls, "Identity Provider URL", "-Identity Provider URL", "Identity Provider URL=long"],
];

const flagCases = (columns: string, sort: string, filter: string): [string, string[]][] => [
  ["default", []],
  ["extended", ["-x"]],
  ["csv", ["--csv"]],
  ["csv-extended", ["--csv", "-x"]],
  ["output-csv", ["--output=csv"]],
  ["output-json", ["--output=json"]],
  ["output-yaml", ["--output=yaml"]],
  ["no-header", ["--no-header"]],
  ["no-truncate", ["--no-truncate", "-x"]],
  ["columns", [`--columns=${columns}`]],
  ["sort", [`--sort=${sort}`]],
  ["filter", [`--filter=${filter}`]],
];

const runAndCapture = async (commandClass: any, argv: string[]): Promise<string> => {
  let output = "";
  const write = jest.spyOn(process.stdout, "write").mockImplementation((chunk: any) => {
    output += chunk.toString();
    return true;
  });
  const log = jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
    output += args.join(" ") + "\n";
  });
  try {
    const command = new commandClass(argv, oclifTestConfig);
    (command as any).cliProviderService = cliProviderService;
    await command.run();
  } finally {
    write.mockRestore();
    log.mockRestore();
  }
  return output;
};

describe("golden table output", () => {
  for (const [name, commandClass, columns, sort, filter] of commands) {
    describe(name, () => {
      test.each(flagCases(columns, sort, filter))("%s", async (caseName, argv) => {
        const output = await runAndCapture(commandClass, argv);
        const goldenFile = path.join(goldenDir, `${name}.${caseName}.txt`);
        if (record) {
          fs.mkdirSync(goldenDir, { recursive: true });
          fs.writeFileSync(goldenFile, output);
        }
        expect(output).toBe(fs.readFileSync(goldenFile, "utf8"));
      });
    });
  }
});
