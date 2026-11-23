import { describe, expect, jest, test } from "@jest/globals";
import GetDefaultRegion from "./get-default";
import { oclifTestConfig } from "../../../test/oclif-test-config";

describe("GetDefaultRegion", () => {
  test("run", async () => {
    const cliProviderService = { regionsService: { getDefaultAwsRegion: () => "defaultRegion" } } as any;

    const command = new GetDefaultRegion([], oclifTestConfig);
    (command as any).cliProviderService = cliProviderService;
    command.log = jest.fn();

    await command.run();

    expect(command.log).toHaveBeenCalledWith("defaultRegion");
  });
});
