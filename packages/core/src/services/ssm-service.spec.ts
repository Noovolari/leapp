import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import { SsmService } from "./ssm-service";
import { ExecuteService } from "./execute-service";
import { CredentialsInfo } from "../models/credentials-info";

jest.mock("../models/session");

describe("SsmService", () => {
  let ssmService: SsmService;
  let executeService: ExecuteService;
  let credentialInfo: CredentialsInfo;
  let mockedCallback: any;
  let setConfig;

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

    ssmService = new SsmService(null, executeService);
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
});
