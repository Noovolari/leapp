import { describe, expect, jest, test } from "@jest/globals";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";
import AddSession from "./add";
import { IdpUrlAccessMethodField } from "@noovolari/leapp-core/models/idp-url-access-method-field";
import { AccessMethodFieldType } from "@noovolari/leapp-core/models/access-method-field-type";

describe("AddSession", () => {
  const getTestCommand = (cliProviderService: any = null, createIdpUrlCommand: any = null): AddSession => {
    const command = new AddSession([], {} as any, createIdpUrlCommand);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("chooseCloudProvider", async () => {
    const cliProviderService: any = {
      cloudProviderService: {
        availableCloudProviders: () => [CloudProviderType.aws],
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedProvider",
              message: "select a provider",
              type: "list",
              choices: [{ name: "aws" }],
            },
          ]);
          return { selectedProvider: "aws" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedCloudProvider = await command.chooseCloudProvider();
    expect(selectedCloudProvider).toBe("aws");
  });

  test("chooseAccessMethod", async () => {
    const cliProviderService: any = {
      cloudProviderService: {
        creatableAccessMethods: () => [{ label: "IAmUser" }],
      },
      inquirer: {
        prompt: (param: any) => {
          expect(param).toEqual([
            {
              choices: [{ name: "IAmUser", value: { label: "IAmUser" } }],
              message: "select an access method",
              name: "selectedMethod",
              type: "list",
            },
          ]);
          return { selectedMethod: "Method" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const accessMethod = await command.chooseAccessMethod(CloudProviderType.aws);
    expect(accessMethod).toStrictEqual("Method");
  });

  test("chooseAccessMethodParams", async () => {
    const expectedMap: any = new Map<string, any>([["field", "choiceValue"]]);
    const selectedAccessMethod: any = {
      accessMethodFields: [
        {
          creationRequestField: "field",
          message: "message",
          type: "type",
          choices: [{ fieldName: "choice", fieldValue: "choiceValue" }],
        },
      ],
    };
    const cliProviderService: any = {
      inquirer: {
        prompt: (params: any) => {
          expect(params).toStrictEqual([
            {
              name: "field",
              message: "message",
              type: "type",
              choices: [{ name: "choice", value: "choiceValue" }],
            },
          ]);
          return { field: "choiceValue" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const map = await command.chooseAccessMethodParams(selectedAccessMethod);
    expect(map).toEqual(expectedMap);
  });

  test("chooseAccessMethodParams - IdpUrlAccessMethodField", async () => {
    const expectedMap: any = new Map<string, any>([["field", "choiceValue"]]);
    const idpUrlAccessMethodField = new IdpUrlAccessMethodField("field", "message", AccessMethodFieldType.list, []);
    idpUrlAccessMethodField.isIdpUrlToCreate = jest.fn(() => false);
    const selectedAccessMethod: any = {
      accessMethodFields: [idpUrlAccessMethodField],
    };
    const cliProviderService: any = {
      inquirer: {
        prompt: () => ({ field: "choiceValue" }),
      },
    };

    const command = getTestCommand(cliProviderService);
    const map = await command.chooseAccessMethodParams(selectedAccessMethod);
    expect(map).toEqual(expectedMap);
  });

  test("chooseAccessMethodParams - IdpUrlAccessMethodField - idpUrl creation", async () => {
    const expectedMap: any = new Map<string, any>([["field", "newIdpUrlId"]]);
    const idpUrlAccessMethodField = new IdpUrlAccessMethodField("field", "message", AccessMethodFieldType.list, []);
    idpUrlAccessMethodField.isIdpUrlToCreate = jest.fn(() => true);
    const selectedAccessMethod: any = {
      accessMethodFields: [idpUrlAccessMethodField],
    };
    const cliProviderService: any = {
      inquirer: {
        prompt: () => ({ field: null }),
      },
    };
    const createIdpUrlCommand = {
      promptAndCreateIdpUrl: async () => ({ id: "newIdpUrlId" }),
    };

    const command = getTestCommand(cliProviderService, createIdpUrlCommand);
    const map = await command.chooseAccessMethodParams(selectedAccessMethod);
    expect(map).toEqual(expectedMap);
  });

  test("chooseAccessMethodParams - choices not present", async () => {
    const selectedAccessMethod: any = {
      accessMethodFields: [{ creationRequestField: "field", message: "message", type: "type", choices: undefined }],
    };
    const cliProviderService: any = {
      inquirer: {
        prompt: (params: any) => {
          expect(params).toStrictEqual([
            {
              name: "field",
              message: "message",
              type: "type",
              choices: undefined,
            },
          ]);
          return { field: "inputValue" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const map = await command.chooseAccessMethodParams(selectedAccessMethod);
    expect(map).toEqual(new Map<string, any>([["field", "inputValue"]]));
  });

  test("createSession", async () => {
    const selectedParams = new Map<string, string>([["name", "prova"]]);
    const accessMethod: any = {
      getSessionCreationRequest: (params: any) => {
        expect(params).toEqual(selectedParams);
        return "creationRequest";
      },
      sessionType: "sessionType",
    };

    const cliProviderService: any = { sessionFactory: { createSession: jest.fn() }, remoteProceduresClient: { refreshSessions: jest.fn() } };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    await command.createSession(accessMethod, selectedParams);
    expect(cliProviderService.sessionFactory.createSession).toHaveBeenCalledWith("sessionType", "creationRequest");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("session added");
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const cloudProvider = "cloudProvider";
    const accessMethod = "accessMethod";
    const params = "params";
    const command = getTestCommand();
    command.chooseCloudProvider = jest.fn(async (): Promise<any> => cloudProvider);
    command.chooseAccessMethod = jest.fn(async (): Promise<any> => accessMethod);
    command.chooseAccessMethodParams = jest.fn(async (): Promise<any> => params);
    command.createSession = jest.fn(async (): Promise<void> => {
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

    expect(command.chooseCloudProvider).toHaveBeenCalled();
    expect(command.chooseAccessMethod).toHaveBeenCalledWith(cloudProvider);
    expect(command.chooseAccessMethodParams).toHaveBeenCalledWith(accessMethod);
    expect(command.createSession).toHaveBeenCalledWith(accessMethod, params);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - createSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
