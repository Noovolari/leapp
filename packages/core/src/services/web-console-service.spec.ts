import { jest, describe, expect, test } from "@jest/globals";
import { WebConsoleService } from "./web-console-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggedEntry, LogLevel } from "./log-service";

describe("WebConsoleService", () => {
  const getService = () => {
    const shellService: any = {
      openExternalUrl: jest.fn((_loginUrl: string): void => {}),
    };

    const logService: any = {
      log: jest.fn(),
    };

    const fetch: any = () => ({
      json: () => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SigninToken: "mocked-aws_session_token",
      }),
    });
    return new WebConsoleService(shellService, logService, fetch);
  };

  test("getWebConsoleUrl - throws error if session's region starts with cn-", async () => {
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
      await webConsoleService.getWebConsoleUrl(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    } catch (e) {
      expect(e).toEqual(new Error("Unsupported Region"));
    }
  });

  test("getWebConsoleUrl - generates a valid aws url to log", async () => {
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
    const result1 = await webConsoleService.getWebConsoleUrl(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    expect(result1).toStrictEqual(truthUrl);

    mockedSessionRegion = "us-gov-";
    federationUrl = "https://signin.amazonaws-us-gov.com/federation";
    consoleHomeURL = `https://console.amazonaws-us-gov.com/console/home?region=${mockedSessionRegion}`;
    truthUrl = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${signinToken}`;
    const result2 = await webConsoleService.getWebConsoleUrl(credentialsInfo, mockedSessionRegion);
    expect(result2).toStrictEqual(truthUrl);
  });

  test("openWebConsole", async () => {
    const webConsoleService: WebConsoleService = getService();
    webConsoleService.getWebConsoleUrl = jest.fn(async () => "fake-web-console-url");
    await webConsoleService.openWebConsole("fake-credentials-info" as any, "fake-session-region", 3000);
    expect(webConsoleService.getWebConsoleUrl).toHaveBeenCalledWith("fake-credentials-info", "fake-session-region", 3000);
    expect((webConsoleService as any).logService.log).toHaveBeenCalledWith(new LoggedEntry("Opening Web Console in browser", this, LogLevel.info));
    expect((webConsoleService as any).shellService.openExternalUrl).toHaveBeenCalledWith("fake-web-console-url");
  });
});
