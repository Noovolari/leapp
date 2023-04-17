import { ux } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";
import ListIdpUrls from "./list";

describe("ListIdpUrls", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): ListIdpUrls => {
    const command = new ListIdpUrls(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run", async () => {
    const command = getTestCommand();
    command.showIdpUrls = jest.fn();
    await command.run();

    expect(command.showIdpUrls).toHaveBeenCalled();
  });

  test("run - showIdpUrls throw an error", async () => {
    const command = getTestCommand();
    command.showIdpUrls = jest.fn(async () => {
      throw new Error("error");
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("error"));
    }
  });

  test("run - showIdpUrls throw an object", async () => {
    const command = getTestCommand();
    const errorToThrow = "string";
    command.showIdpUrls = jest.fn(async () => {
      throw errorToThrow;
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("Unknown error: string"));
    }
  });

  test("showIdpUrls", async () => {
    const idpUrls = [
      {
        url: "idpUrlsName",
      },
    ];
    const cliProviderService = {
      idpUrlsService: {
        getIdpUrls: () => idpUrls,
      },
    };

    const command = getTestCommand(cliProviderService);
    const tableSpy = jest.spyOn(ux, "table").mockImplementation(() => null);

    await command.showIdpUrls();

    const expectedData = [
      {
        url: "idpUrlsName",
      },
    ];

    expect(tableSpy.mock.calls[0][0]).toEqual(expectedData);

    const expectedColumns = {
      id: { header: "ID", extended: true },
      url: { header: "Identity Provider URL" },
    };
    expect(tableSpy.mock.calls[0][1]).toEqual(expectedColumns);
  });
});
