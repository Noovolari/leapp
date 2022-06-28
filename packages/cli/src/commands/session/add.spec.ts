import { describe, expect, jest, test } from "@jest/globals";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";
import AddSession from "./add";
import { IdpUrlAccessMethodField } from "@noovolari/leapp-core/models/idp-url-access-method-field";
import { AccessMethodFieldType } from "@noovolari/leapp-core/models/access-method-field-type";
import { CliProviderService } from "../../service/cli-provider-service";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("AddSession", () => {
  const getTestCommand = (cliProviderService: any = null, createIdpUrlCommand: any = null, argv = []): AddSession => {
    const command = new AddSession(argv, {} as any, createIdpUrlCommand);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - test all flags and combinations", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{}]),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      namedProfilesService: { getNamedProfiles: jest.fn(() => [{ id: "defaultId", name: "default" }]) },
      awsCoreService: new CliProviderService().awsCoreService,
      azureCoreService: new CliProviderService().azureCoreService,
      cloudProviderService: new CliProviderService().cloudProviderService,
      sessionFactory: { createSession: jest.fn() },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      inquirer: {
        prompt: () => ({
          selectedMethod: ["selectedMethod"],
        }),
      },
    };
    let command = getTestCommand(cliProviderService, null, ["--providerType"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --providerType expects a value");

    command = getTestCommand(cliProviderService, null, ["--providerType", "fake"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Expected --providerType=fake to be one of: aws, azure");

    command = getTestCommand(cliProviderService, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamUser",
      "--region",
      "nottrue",
      "--sessionName",
      "test",
      "--profileId",
      "id",
      "--accessKey",
      "aid",
      "--secretKey",
      "sid",
    ]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("AWS Region not valid");

    command = getTestCommand(cliProviderService, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamUser",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--profileId",
      "id",
      "--accessKey",
      "aid",
      "--secretKey",
      "sid",
    ]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Invalid Profile Id");

    command = getTestCommand(cliProviderService, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamUser",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--accessKey",
      "aid",
      "--secretKey",
      "sid",
    ]);
    command.log = jest.fn();
    await command.run();

    command = getTestCommand(cliProviderService, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamRoleFederated",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--roleArn",
      "role",
      "--idpArn",
      "idp",
      "--idpUrl",
      "idpUrlTest",
    ]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Invalid Idp URL");

    const cliMock3: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{}]),
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      namedProfilesService: { getNamedProfiles: jest.fn(() => [{ id: "defaultId", name: "default" }]) },
      awsCoreService: new CliProviderService().awsCoreService,
      azureCoreService: new CliProviderService().azureCoreService,
      cloudProviderService: new CliProviderService().cloudProviderService,
      sessionFactory: { createSession: jest.fn() },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [{ id: "idpId", url: "http://idpUrlTest" }]),
        createIdpUrl: jest.fn((url) => ({ id: "newId", url })),
      },
    };
    command = getTestCommand(cliMock3, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamRoleFederated",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--roleArn",
      "role",
      "--idpArn",
      "idp",
      "--idpUrl",
      "http://idpUrlTest",
    ]);
    command.log = jest.fn();
    await command.run();

    expect(cliMock3.sessionFactory.createSession).toHaveBeenCalledWith("awsIamRoleFederated", {
      sessionName: "test",
      region: "eu-west-1",
      roleArn: "role",
      idpArn: "idp",
      idpUrl: "idpId",
      profileId: "defaultId",
    });
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("session added");

    const cliMock4: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{}]),
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      namedProfilesService: { getNamedProfiles: jest.fn(() => [{ id: "defaultId", name: "default" }]) },
      awsCoreService: new CliProviderService().awsCoreService,
      azureCoreService: new CliProviderService().azureCoreService,
      cloudProviderService: new CliProviderService().cloudProviderService,
      sessionFactory: { createSession: jest.fn() },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [{ id: "idpId", url: "http://idpUrlTest" }]),
        createIdpUrl: jest.fn((url) => ({ id: "newId", url })),
      },
    };
    command = getTestCommand(cliMock4, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamRoleFederated",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--roleArn",
      "role",
      "--idpArn",
      "idp",
      "--idpUrl",
      "http://idpUrlTest",
      "--profileId",
      "not",
    ]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Invalid Profile Id");

    const cliMock5: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{ sessionId: "parentId", type: SessionType.awsIamRoleFederated }]),
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      namedProfilesService: { getNamedProfiles: jest.fn(() => [{ id: "defaultId", name: "default" }]) },
      awsCoreService: new CliProviderService().awsCoreService,
      azureCoreService: new CliProviderService().azureCoreService,
      cloudProviderService: new CliProviderService().cloudProviderService,
      sessionFactory: { createSession: jest.fn() },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [{ id: "idpId", url: "http://idpUrlTest" }]),
        createIdpUrl: jest.fn((url) => ({ id: "newId", url })),
      },
    };
    command = getTestCommand(cliMock5, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamRoleChained",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--roleArn",
      "role",
      "--parentSessionId",
      "parentId",
    ]);
    command.log = jest.fn();
    await command.run();

    expect(cliMock5.sessionFactory.createSession).toHaveBeenCalledWith("awsIamRoleChained", {
      sessionName: "test",
      region: "eu-west-1",
      roleArn: "role",
      parentSessionId: "parentId",
      profileId: "defaultId",
      roleSessionName: "assumed-from-leapp",
    });
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("session added");

    const cliMock6: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{ sessionId: "parentId", type: SessionType.awsIamRoleFederated }]),
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      namedProfilesService: { getNamedProfiles: jest.fn(() => [{ id: "defaultId", name: "default" }]) },
      awsCoreService: new CliProviderService().awsCoreService,
      azureCoreService: new CliProviderService().azureCoreService,
      cloudProviderService: new CliProviderService().cloudProviderService,
      sessionFactory: { createSession: jest.fn() },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [{ id: "idpId", url: "http://idpUrlTest" }]),
        createIdpUrl: jest.fn((url) => ({ id: "newId", url })),
      },
    };
    command = getTestCommand(cliMock6, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamRoleChained",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--roleArn",
      "role",
      "--parentSessionId",
      "parentId",
      "--roleSessionName",
      "myRoleSessionName",
    ]);
    command.log = jest.fn();
    await command.run();

    expect(cliMock6.sessionFactory.createSession).toHaveBeenCalledWith("awsIamRoleChained", {
      sessionName: "test",
      region: "eu-west-1",
      roleArn: "role",
      parentSessionId: "parentId",
      profileId: "defaultId",
      roleSessionName: "myRoleSessionName",
    });
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("session added");

    const cliMock7: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{ sessionId: "parentId", type: SessionType.awsIamRoleFederated }]),
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      namedProfilesService: { getNamedProfiles: jest.fn(() => [{ id: "defaultId", name: "default" }]) },
      awsCoreService: new CliProviderService().awsCoreService,
      azureCoreService: new CliProviderService().azureCoreService,
      cloudProviderService: new CliProviderService().cloudProviderService,
      sessionFactory: { createSession: jest.fn() },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      idpUrlsService: {
        getIdpUrls: jest.fn(() => [{ id: "idpId", url: "http://idpUrlTest" }]),
        createIdpUrl: jest.fn((url) => ({ id: "newId", url })),
      },
    };
    command = getTestCommand(cliMock7, null, [
      "--providerType",
      "aws",
      "--sessionType",
      "awsIamRoleChained",
      "--region",
      "eu-west-1",
      "--sessionName",
      "test",
      "--roleArn",
      "role",
      "--parentSessionId",
      "notexistingparentId",
      "--roleSessionName",
      "myRoleSessionName",
    ]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Invalid Parent Id");
  });

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
    const cloudProvider = "aws";
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

    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    } else {
      expect(command.chooseAccessMethod).toHaveBeenCalledWith(cloudProvider);
      expect(command.chooseAccessMethodParams).toHaveBeenCalledWith(accessMethod);
    }

    expect(command.createSession).toHaveBeenCalledWith(accessMethod, params);
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
