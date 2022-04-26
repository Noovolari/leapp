import { jest, describe, test, expect } from "@jest/globals";
import EditIdpUrl from "./edit";

describe("EditIdpUrl", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): EditIdpUrl => {
    const command = new EditIdpUrl(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    (command as any).validateMyFlags = jest.fn((_: any) => {
      if (argv[1] === "") {
        throw new Error("IdP URL ID can't be empty");
      }

      if (!cliProviderService.idpUrlsService.getIdpUrl(argv[1])) {
        throw new Error("IdP URL not found");
      }
      if (argv[3] === "") {
        throw new Error("IdP URL can't be empty");
      }
      if (argv[3].indexOf("http://") < 0 || argv[3].indexOf("https://") < 0) {
        throw new Error("IdP URL is not valid");
      }
      return true;
    });
    return command;
  };

  test("Flags - IdPUrlId & IdPUrl", async () => {
    const cliProviderService = {
      idpUrlsService: {
        getIdpUrl: (idpUrlId: string) => idpUrlId === "foundId",
      },
    };

    let command = getTestCommand(cliProviderService, ["--idpUrlId", "", "--idpUrl", ""]);
    await expect((command as any).run()).rejects.toThrow("IdP URL ID can't be empty");

    command = getTestCommand(cliProviderService, ["--idpUrlId", "foundId", "--idpUrl", ""]);
    await expect((command as any).run()).rejects.toThrow("IdP URL can't be empty");

    command = getTestCommand(cliProviderService, ["--idpUrlId", "foundId", "--idpUrl", "ciccio"]);
    await expect((command as any).run()).rejects.toThrow("IdP URL is not valid");
  });

  test("selectIdpUrl", async () => {
    const idpUrl = { url: "url1" };
    const cliProviderService: any = {
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [idpUrl]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedIdpUrl",
              message: "select an identity provider URL",
              type: "list",
              choices: [{ name: idpUrl.url, value: idpUrl }],
            },
          ]);
          return { selectedIdpUrl: idpUrl };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedIdpUrl = await command.selectIdpUrl();

    expect(cliProviderService.idpUrlsService.getIdpUrls).toHaveBeenCalled();
    expect(selectedIdpUrl).toBe(idpUrl);
  });

  test("selectIdpUrl, no idp urls", async () => {
    const cliProviderService: any = {
      idpUrlsService: {
        getIdpUrls: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectIdpUrl()).rejects.toThrow(new Error("no identity provider URLs available"));
  });

  test("getNewIdpUrl", async () => {
    const cliProviderService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toMatchObject([
            {
              name: "newIdpUrl",
              message: "choose a new URL",
              type: "input",
            },
          ]);
          expect(params[0].validate("url")).toBe("validationResult");
          return { newIdpUrl: "idpUrl" };
        },
      },
      idpUrlsService: {
        validateIdpUrl: jest.fn(() => "validationResult"),
      },
    };

    const command = getTestCommand(cliProviderService);
    const idpUrl = await command.getNewIdpUrl();
    expect(idpUrl).toBe("idpUrl");
    expect(cliProviderService.idpUrlsService.validateIdpUrl).toHaveBeenCalledWith("url");
  });

  test("editIdpUrl", async () => {
    const cliProviderService: any = {
      idpUrlsService: {
        editIdpUrl: jest.fn(),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    await command.editIdpUrl("idpUrlId", "url");

    expect(cliProviderService.idpUrlsService.editIdpUrl).toHaveBeenCalledWith("idpUrlId", "url");
    expect(command.log).toHaveBeenCalledWith("IdP URL edited");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const idpUrl = { id: "1" };
    const newUrl = "newName";

    const command = getTestCommand();
    command.selectIdpUrl = jest.fn(async (): Promise<any> => idpUrl);
    command.getNewIdpUrl = jest.fn(async (): Promise<any> => newUrl);
    command.editIdpUrl = jest.fn(async () => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    let occurredError;
    try {
      await command.run();
    } catch (error) {
      occurredError = error;
    }

    expect(command.selectIdpUrl).toHaveBeenCalled();
    expect(command.getNewIdpUrl).toHaveBeenCalled();
    expect(command.editIdpUrl).toHaveBeenCalledWith(idpUrl.id, newUrl);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - editIdpUrl throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - editIdpUrl throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
