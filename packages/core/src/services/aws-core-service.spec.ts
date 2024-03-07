import { describe, test, expect, jest } from "@jest/globals";
import { AwsCoreService } from "./aws-core-service";
import { constants } from "../models/constants";

describe("AwsCoreService", () => {
  const homedir = "homedir-path";
  const nativeService = {
    os: {
      homedir: jest.fn(() => homedir),
    },
    path: {
      join: jest.fn((...array) => array.join("/")),
    },
    fs: {
      writeFileSync: jest.fn((_file, _data) => {}),
    },
  } as any;
  const httpHandler = {} as any;

  test("getRegions", () => {
    const awsCoreService = new AwsCoreService(httpHandler, null, null);

    expect(awsCoreService.getRegions()).toEqual([
      {
        region: "af-south-1",
      },
      {
        region: "ap-east-1",
      },
      {
        region: "ap-northeast-1",
      },
      {
        region: "ap-northeast-2",
      },
      {
        region: "ap-northeast-3",
      },
      {
        region: "ap-south-1",
      },
      {
        region: "ap-southeast-1",
      },
      {
        region: "ap-southeast-2",
      },
      {
        region: "ap-southeast-3",
      },
      {
        region: "ap-southeast-4",
      },
      {
        region: "ca-central-1",
      },
      {
        region: "cn-north-1",
      },
      {
        region: "cn-northwest-1",
      },
      {
        region: "eu-central-1",
      },
      {
        region: "eu-central-2",
      },
      {
        region: "eu-north-1",
      },
      {
        region: "eu-south-1",
      },
      {
        region: "eu-south-2",
      },
      {
        region: "eu-west-1",
      },
      {
        region: "eu-west-2",
      },
      {
        region: "eu-west-3",
      },
      {
        region: "me-central-1",
      },
      {
        region: "me-south-1",
      },
      {
        region: "sa-east-1",
      },
      {
        region: "us-east-1",
      },
      {
        region: "us-east-2",
      },
      {
        region: "us-gov-east-1",
      },
      {
        region: "us-gov-west-1",
      },
      {
        region: "us-west-1",
      },
      {
        region: "us-west-2",
      },
    ]);
  });

  test("awsCredentialPath", () => {
    const awsCoreService = new AwsCoreService(httpHandler, nativeService, null);
    expect(awsCoreService.awsCredentialPath()).toBe(nativeService.path.join(`${homedir}`, `.aws`, `credentials`));
  });

  test("awsBkpCredentialPath", () => {
    const awsCoreService = new AwsCoreService(httpHandler, nativeService, null);
    expect(awsCoreService.awsBkpCredentialPath()).toBe(nativeService.path.join(`${homedir}`, `.aws`, `credentials.bkp`));
  });

  test("awsConfigPath", () => {
    const awsCoreService = new AwsCoreService(httpHandler, nativeService, null);
    expect(awsCoreService.awsConfigPath()).toBe(nativeService.path.join(`${homedir}`, `.aws`, `config`));
  });

  test("awsBkpConfigPath", () => {
    const awsCoreService = new AwsCoreService(httpHandler, nativeService, null);
    expect(awsCoreService.awsBkpConfigPath()).toBe(nativeService.path.join(`${homedir}`, `.aws`, `config.bkp`));
  });

  test("stsOptions", () => {
    const timeout = constants.timeout;
    const endpoint = AwsCoreService.stsEndpointsPerRegion.get("eu-west-1");
    const session = {
      region: "eu-west-1",
    } as any;
    const session2 = {
      region: undefined,
    } as any;
    const awsCoreService = new AwsCoreService(httpHandler, nativeService, null);
    const result = awsCoreService.stsOptions(session);
    expect(result).toStrictEqual({
      maxRetries: 0,
      httpOptions: { timeout },
      endpoint,
      region: session.region,
    });
    const result2 = awsCoreService.stsOptions(session2);
    expect(result2).toStrictEqual({
      maxRetries: 0,
      httpOptions: { timeout },
    });
  });
});
