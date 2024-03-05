import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { SsmService } from "./ssm-service";
import { ExecuteService } from "./execute-service";
import { CredentialsInfo } from "../models/credentials-info";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry } from "./log-service";
import { LoggedException, LogLevel, LogService } from "./log-service";

jest.mock("../models/session");

describe("SsmService", () => {
  let ssmService: SsmService;
  let executeService: ExecuteService;
  let credentialInfo: CredentialsInfo;
  let mockedCallback: any;
  //let setConfig;
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
    //setConfig = jest.spyOn(SsmService, "setConfig");

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
  });

  test("getSsmInstances - should retrieve a list of ssm sessions given a valid region", (done) => {
    (ssmService as any).applyEc2MetadataInformation = jest.fn((_: any): any => []);
    (ssmService as any).requestSsmInstances = jest.fn((_: any): any => []);

    ssmService.getSsmInstances(credentialInfo, "eu-west-1", mockedCallback);

    setTimeout(() => {
      expect(mockedCallback).toHaveBeenCalled();
      expect((ssmService as any).applyEc2MetadataInformation).toHaveBeenCalled();
      done();
    }, 100);
  });

  test("getSsmInstances - should call private method", (done) => {
    (ssmService as any).applyEc2MetadataInformation = jest.fn((_: any): any => []);
    (ssmService as any).requestSsmInstances = jest.fn((_: any): any => []);

    const mockedEc2Callback = jest.fn();

    ssmService.getSsmInstances(credentialInfo, "eu-west-1", mockedEc2Callback);

    setTimeout(() => {
      expect((ssmService as any).requestSsmInstances).toHaveBeenCalled();
      expect((ssmService as any).applyEc2MetadataInformation).toHaveBeenCalled();
      expect(mockedEc2Callback).toHaveBeenCalled();
      done();
    }, 100);
  });

  test("getSsmInstances - setFilteringForEc2CallsCallback not set", (done) => {
    (ssmService as any).applyEc2MetadataInformation = jest.fn((_: any): any => []);
    (ssmService as any).requestSsmInstances = jest.fn((_: any): any => []);

    ssmService.getSsmInstances(credentialInfo, "eu-west-1");

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
    const logger = { log: jest.fn() };
    const logService = new LogService(logger as any);
    jest.spyOn(logService, "log");

    ssmService = new SsmService(logService as any, executeService, nativeService, null);

    ssmService.startSession(credentialInfo, instanceId, region);

    setTimeout(() => {
      expect(executeService.getQuote).toHaveBeenCalled();
      expect(executeService.openTerminal).toHaveBeenCalledWith(
        `aws ssm start-session --region ${region} --target ${quote}${instanceId}${quote}`,
        env,
        undefined
      );
      done();
      expect(logService.log).not.toHaveBeenCalled();
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

  test("startSession - openTerminal throws an error and on macOS the env file is removed", (done) => {
    jest.useFakeTimers();

    const mockedHomeDir = "/Users/mock";
    const fileService = {
      writeFileSync: jest.fn(() => {}),
    } as any;
    const executeService2 = {
      getQuote: () => {},
      openTerminal: jest.fn((_1: any, _2: any, _3: any) => ({ ["then"]: jest.fn(() => ({ ["catch"]: (clb) => clb({ message: "error" }) })) })),
    } as any;
    const nativeService2 = {
      process: {
        platform: "darwin",
      },
      os: {
        homedir: () => mockedHomeDir,
      },
      rimraf: jest.fn(() => {}),
    } as any;
    const logger = { log: jest.fn(), show: jest.fn() };
    const logService = new LogService(logger as any);
    jest.spyOn(logService, "log");
    ssmService = new SsmService(logService as any, executeService2, nativeService2, fileService);
    const instanceId = "mocked-id";
    const region = "eu-west-1";

    ssmService.startSession(credentialInfo, instanceId, region);
    setTimeout(() => {
      expect(nativeService2.rimraf).toHaveBeenCalled();
      expect(logService.log).toHaveBeenCalledWith(new LoggedException("error", this, LogLevel.error, true));
      const nativeService3 = {
        process: {
          platform: "not-darwin",
        },
        os: {
          homedir: () => mockedHomeDir,
        },
        rimraf: jest.fn(),
      } as any;
      const ssmService2 = new SsmService(logService as any, executeService2, nativeService3, fileService);
      ssmService2.startSession(credentialInfo, instanceId, region);

      expect(logService.log).toHaveBeenCalledWith(new LoggedException("error", this, LogLevel.error, true));
      expect(nativeService3.rimraf).not.toHaveBeenCalled();
      done();
    }, 200);
    jest.runAllTimers();
  });

  test("requestSsmInstances, plus error checking", async () => {
    const logService: any = {
      log: jest.fn(),
    };

    ssmService = new SsmService(logService, executeService, nativeService, null);
    const instanceId = "mocked-id";
    const region = "eu-west-1";

    let index = 0;
    (ssmService as any).ssmClient = {
      send: jest.fn(async () =>
        Promise.resolve({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          InstanceInformationList: [
            {
              fakeInstanceId: "fake-id-1",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PingStatus: "Offline",
            },
            {
              fakeInstanceId: "fake-id-2",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PingStatus: "Online",
            },
          ],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          NextToken: index++ < 3 ? "fake-next-token" : undefined,
        })
      ),
    };

    jest.spyOn(ssmService as any, "requestSsmInstances");
    const result = await (ssmService as any).requestSsmInstances(credentialInfo, instanceId, region);
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry("Obtained smm info from aws for SSM", ssmService, LogLevel.info));
    expect((ssmService as any).ssmClient.send).toHaveBeenCalledTimes(4);

    const resultObject = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ComputerName: undefined,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Name: undefined,
      fakeInstanceId: "fake-id-2",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      PingStatus: "Online",
    };
    expect(result).toStrictEqual([resultObject, resultObject, resultObject, resultObject]);

    (ssmService as any).ssmClient = {
      send: jest.fn(async () =>
        Promise.resolve({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          InstanceInformationList: [
            {
              fakeInstanceId: "fake-id-1",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PingStatus: "Offline",
            },
            {
              fakeInstanceId: "fake-id-2",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PingStatus: "Offline",
            },
          ],
        })
      ),
    };

    await expect(async () => {
      await (ssmService as any).requestSsmInstances(credentialInfo, instanceId, region);
    }).rejects.toThrow(new Error("No instances are accessible by this Role."));

    (ssmService as any).ssmClient = {
      send: jest.fn(async () => Promise.resolve({})),
    };

    await expect(async () => {
      await (ssmService as any).requestSsmInstances(credentialInfo, instanceId, region);
    }).rejects.toThrow(new Error("No instances are accessible by this Role."));
  });

  test("applyEc2MetadataInformation", async () => {
    const mockedInstances = [
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { id: 1, Name: "fake-instance-ip-address" },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { id: 2, Name: "found-id" },
    ];
    let reservations = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Reservations: [
        // eslint-disable-next-line @typescript-eslint/naming-convention
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Instances: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              InstanceId: "found-id",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              Tags: [{ Key: "Name", Value: "Mocked Name" }],
            },
          ],
        },
      ],
    };

    let ec2Client = {
      send: jest.fn(async () => Promise.resolve(reservations)),
    };

    const logService: any = {
      log: jest.fn(),
    };

    ssmService = new SsmService(logService, executeService, nativeService, null);
    (ssmService as any).ec2Client = ec2Client;
    let result = await (ssmService as any).applyEc2MetadataInformation(mockedInstances);
    expect(result).toStrictEqual(mockedInstances);

    reservations = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Reservations: [
        // eslint-disable-next-line @typescript-eslint/naming-convention
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Instances: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              InstanceId: "not-found-id",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              Tags: [{ Key: "Name", Value: "Mocked Name" }],
            },
          ],
        },
      ],
    };
    ec2Client = {
      send: jest.fn(async () => Promise.resolve(reservations)),
    };
    (ssmService as any).ec2Client = ec2Client;
    result = await (ssmService as any).applyEc2MetadataInformation(mockedInstances);
    expect(result).toStrictEqual(mockedInstances);

    reservations = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Reservations: [
        // eslint-disable-next-line @typescript-eslint/naming-convention
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Instances: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              InstanceId: "found-id",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              Tags: [{ Key: "Not-Name", Value: "Not Mocked Name" }],
            },
          ],
        },
      ],
    };
    ec2Client = {
      send: jest.fn(async () => Promise.resolve(reservations)),
    };
    (ssmService as any).ec2Client = ec2Client;
    result = await (ssmService as any).applyEc2MetadataInformation(mockedInstances);
    expect(result).toStrictEqual(mockedInstances);
    expect(mockedInstances[1].Name).not.toStrictEqual("Not Mocked Name");

    ec2Client.send = jest.fn(async () => Promise.reject({ message: "Error" }));

    await expect(async () => {
      await (ssmService as any).applyEc2MetadataInformation(mockedInstances);
    }).rejects.toThrow(new LoggedException("Error", this, LogLevel.warn));
  });

  test("applyEc2MetadataInformation - no found names", async () => {
    const mockedInstances = [
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { id: 1, Name: "fake-instance-ip-address" },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { id: 2, Name: "found-id" },
    ];
    const reservations = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Reservations: [
        // eslint-disable-next-line @typescript-eslint/naming-convention
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Instances: [
            {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              InstanceId: "found-id",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              Tags: [{ Key: "Not-Name", Value: "Mocked Name" }],
            },
          ],
        },
      ],
    };

    const logService: any = {
      log: jest.fn(),
    };

    ssmService = new SsmService(logService, executeService, nativeService, null);
    (ssmService as any).ec2Client = {
      send: jest.fn(async () => Promise.resolve(reservations)),
    };

    const result = await (ssmService as any).applyEc2MetadataInformation(mockedInstances);
    expect(result).toStrictEqual(mockedInstances);

    const result2 = await (ssmService as any).applyEc2MetadataInformation([]);
    expect(result2).toStrictEqual([]);
  });

  test("log service completion - must be done here because it seems that for jest --coverage the file is tied here...", () => {
    const logger = { log: jest.fn(), show: jest.fn() };
    let logService = new LogService(logger as any);

    logService.log(new LoggedEntry("message", this, LogLevel.info, false));
    expect(logger.log).toHaveBeenCalled();

    logService = new LogService(logger as any);
    logService.log(new LoggedEntry("message", this, LogLevel.warn, false));
    expect(logger.log).toHaveBeenCalled();

    logService = new LogService(logger as any);
    logService.log(new LoggedEntry("message", this, LogLevel.success, false));
    expect(logger.log).toHaveBeenCalled();

    logService = new LogService(logger as any);
    logService.log(new LoggedException("message", this, LogLevel.error, false));
    expect(logger.log).toHaveBeenCalled();

    logService = new LogService(logger as any);
    logService.log(new LoggedEntry("message", this, LogLevel.success, true));
    expect(logger.log).toHaveBeenCalled();
    expect(logger.show).toHaveBeenCalled();
  });
});
