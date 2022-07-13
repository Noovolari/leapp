import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import { SsmService } from "./ssm-service";
import { ExecuteService } from "./execute-service";
import { CredentialsInfo } from "../models/credentials-info";
import { INativeService } from "../interfaces/i-native-service";

jest.mock("../models/session");

describe("SsmService", () => {
  let ssmService: SsmService;
  let executeService: ExecuteService;
  let credentialInfo: CredentialsInfo;
  let mockedCallback: any;
  let setConfig;
  let nativeService: INativeService;

  beforeEach(() => {
    credentialInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "123",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "345",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "678",
      },
    };

    mockedCallback = jest.fn(() => {});
    setConfig = jest.spyOn(SsmService, "setConfig");

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    executeService = {
      execute: jest.fn((_: string, _1?: boolean): Promise<string> => Promise.resolve("")),
      getQuote: jest.fn(() => ""),
      openTerminal: jest.fn((_: string, _1?: any): Promise<string> => Promise.resolve("")),
    };
    (executeService as any).nativeService = null;
    (executeService as any).repository = null;

    nativeService = {
      process: {
        platform: "",
      },
    } as any;

    ssmService = new SsmService(null, executeService, nativeService, null);
    ssmService.aws = {
      config: {
        update: jest.fn((_: any) => {}),
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      SSM: jest.fn(() => {}),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      EC2: jest.fn(() => {}),
    };
  });

  test("getSsmInstances - should retrieve a list of ssm sessions given a valid region", (done) => {
    (ssmService as any).applyEc2MetadataInformation = jest.fn((_: any): any => []);
    (ssmService as any).requestSsmInstances = jest.fn((_: any): any => []);

    ssmService.getSsmInstances(credentialInfo, "eu-west-1", mockedCallback);

    setTimeout(() => {
      expect(setConfig).toHaveBeenCalled();

      expect(ssmService.aws.config.update).toBeCalledWith({
        region: "eu-west-1",
        accessKeyId: "123",
        secretAccessKey: "345",
        sessionToken: "678",
      });

      expect(ssmService.aws.SSM).toHaveBeenCalled();
      expect(ssmService.aws.EC2).toHaveBeenCalled();

      expect(mockedCallback).toHaveBeenCalled();

      expect((ssmService as any).applyEc2MetadataInformation).toHaveBeenCalled();
      done();
    }, 100);
  });

  test("getSsmInstances - should call private method", (done) => {
    (ssmService as any).applyEc2MetadataInformation = jest.fn((_: any): any => []);
    (ssmService as any).requestSsmInstances = jest.fn((_: any): any => []);

    ssmService.getSsmInstances(credentialInfo, "eu-west-1", mockedCallback);

    setTimeout(() => {
      expect((ssmService as any).requestSsmInstances).toHaveBeenCalled();
      expect((ssmService as any).applyEc2MetadataInformation).toHaveBeenCalled();
      done();
    }, 100);
  });

  test("startSession - should start a ssm session by calling the execute service", (done) => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_ACCESS_KEY_ID: "123",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SECRET_ACCESS_KEY: "345",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SESSION_TOKEN: "678",
    };

    const region = "eu-west-1";
    const instanceId = "mocked-id";
    const quote = "";

    ssmService.startSession(credentialInfo, instanceId, region);

    setTimeout(() => {
      expect(executeService.getQuote).toHaveBeenCalled();
      expect(executeService.openTerminal).toHaveBeenCalledWith(
        `aws ssm start-session --region ${region} --target ${quote}${instanceId}${quote}`,
        env,
        undefined
      );
      done();
    }, 100);
  });

  test("startSession - on macOS, should create the env file, start an ssm session, and then remove the file", (done) => {
    const env = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_ACCESS_KEY_ID: "123",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SECRET_ACCESS_KEY: "345",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SESSION_TOKEN: "678",
    };

    const mockedHomeDir = "/Users/mock";
    const path = `${mockedHomeDir}/.Leapp/ssm-env`;
    const mockedFileContent = `export AWS_SESSION_TOKEN=${env.AWS_SESSION_TOKEN} &&
          export AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} &&
          export AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID}`;
    const fileService = {
      writeFileSync: jest.fn(() => {}),
    } as any;

    nativeService = {
      process: {
        platform: "darwin",
      },
      os: {
        homedir: () => mockedHomeDir,
      },
      rimraf: jest.fn(),
    } as any;

    ssmService = new SsmService(null, executeService, nativeService, fileService);
    ssmService.aws = {
      config: {
        update: jest.fn((_: any) => {}),
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      SSM: jest.fn(() => {}),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      EC2: jest.fn(() => {}),
    };

    const instanceId = "mocked-id";
    const region = "eu-west-1";
    const quote = "";

    ssmService.startSession(credentialInfo, instanceId, region);

    setTimeout(() => {
      expect(fileService.writeFileSync).toHaveBeenCalledWith(path, mockedFileContent);
      expect(executeService.getQuote).toHaveBeenCalled();
      expect(executeService.openTerminal).toHaveBeenCalledWith(
        `aws ssm start-session --region ${region} --target ${quote}${instanceId}${quote}`,
        env,
        undefined
      );
      expect(nativeService.rimraf).toHaveBeenCalledWith(path, {}, expect.any(Function));
      done();
    }, 100);
  });
});
