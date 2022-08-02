import { jest, describe, expect, test } from "@jest/globals";
import { WebConsoleService } from "./web-console-service";
import { CredentialsInfo } from "../models/credentials-info";

describe("WebConsoleService", () => {
  const getService = () => {
    const shellService: any = {
      openExternalUrl: jest.fn((_loginUrl: string): void => {}),
    };

    const logService: any = {
      log: jest.fn(),
    };

    const nativeService = {
      fetch: () => ({
        json: () => ({
          ["SigninToken"]: "mocked-aws_session_token",
        }),
      }),
    };
    return new WebConsoleService(shellService, logService, nativeService);
  };

  test("openWebConsole - throws error if session's region starts with cn-", async () => {
    const mockedSessionDuration = 3200;

    const credentialsInfo: CredentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "mocked-aws_access_key_id",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "mocked-aws_secret_access_key",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "mocked-aws_session_token",
      },
    };

    const webConsoleService: WebConsoleService = getService();
    const mockedSessionRegion = "cn-";
    try {
      await webConsoleService.openWebConsole(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    } catch (e) {
      expect(e).toEqual(new Error("Unsupported Region"));
    }
  });

  test("openWebConsole - generates a valid aws url to log", async () => {
    let mockedSessionRegion = "eu-west-1";
    const mockedSessionDuration = 3200;

    const credentialsInfo: CredentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "mocked-aws_access_key_id",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "mocked-aws_secret_access_key",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "mocked-aws_session_token",
      },
    };

    const signinToken = credentialsInfo.sessionToken.aws_session_token;
    let federationUrl = "https://signin.aws.amazon.com/federation";
    let consoleHomeURL = `https://${mockedSessionRegion}.console.aws.amazon.com/console/home?region=${mockedSessionRegion}`;
    let truthUrl = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${signinToken}`;

    const webConsoleService: WebConsoleService = getService();
    await webConsoleService.openWebConsole(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    expect((webConsoleService as any).shellService.openExternalUrl).toHaveBeenCalledWith(truthUrl);

    mockedSessionRegion = "us-gov-";
    federationUrl = "https://signin.amazonaws-us-gov.com/federation";
    consoleHomeURL = `https://console.amazonaws-us-gov.com/console/home?region=${mockedSessionRegion}`;
    truthUrl = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${signinToken}`;
    await webConsoleService.openWebConsole(credentialsInfo, mockedSessionRegion);
    expect((webConsoleService as any).shellService.openExternalUrl).toHaveBeenCalled();
    expect((webConsoleService as any).shellService.openExternalUrl).toHaveBeenCalledWith(truthUrl);
  });
});
