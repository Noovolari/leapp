import { describe, expect, jest, test } from "@jest/globals";
import Version from "./version";
import { oclifTestConfig } from "../../test/oclif-test-config";

describe("Version", () => {
  test("run", async () => {
    const cliProviderService = { logService: { getCoreVersion: () => "test-core" } } as any;

    const command = new Version([], oclifTestConfig);
    (command as any).cliProviderService = cliProviderService;
    command.log = jest.fn();
    const cliVersion = require("../../package.json").version;

    await command.run();

    expect(command.log).toHaveBeenCalledWith(`Leapp Cli\n` + `Version ${cliVersion} (Core: test-core)\n` + "© 2022 Noovolari");
  });
});
