import { CliUx } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";
import ListProfiles from "./list";

describe("ListProfiles", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): ListProfiles => {
    const command = new ListProfiles(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run", async () => {
    const command = getTestCommand();
    command.showProfiles = jest.fn();
    await command.run();

    expect(command.showProfiles).toHaveBeenCalled();
  });

  test("run - showProfiles throw an error", async () => {
    const command = getTestCommand();
    command.showProfiles = jest.fn(async () => {
      throw new Error("error");
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("error"));
    }
  });

  test("run - showProfiles throw an object", async () => {
    const command = getTestCommand();
    const errorToThrow = "string";
    command.showProfiles = jest.fn(async () => {
      throw errorToThrow;
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("Unknown error: string"));
    }
  });

  test("showProfiles", async () => {
    const profiles = [
      {
        name: "profileName",
      },
    ];
    const cliProviderService = {
      namedProfilesService: {
        getNamedProfiles: () => profiles,
      },
    };

    const command = getTestCommand(cliProviderService);
    const tableSpy = jest.spyOn(CliUx.ux, "table").mockImplementation(() => null);

    await command.showProfiles();

    const expectedData = [
      {
        name: "profileName",
      },
    ];

    expect(tableSpy.mock.calls[0][0]).toEqual(expectedData);

    const expectedColumns = {
      id: {
        extended: true,
        header: "ID",
      },
      name: { header: "Profile Name" },
    };
    expect(tableSpy.mock.calls[0][1]).toEqual(expectedColumns);
  });
});
