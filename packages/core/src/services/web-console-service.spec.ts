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

    const fetch: any = () => ({
      json: () => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SigninToken: "mocked-aws_session_token",
      }),
    });
    return new WebConsoleService(shellService, logService, fetch);
  };

  test("openWebConsole - throws error if session's region starts with us-gov- or cn-", async () => {
    const mockedSessionRegion = "us-gov-";
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
    try {
      await webConsoleService.openWebConsole(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    } catch (e) {
      expect(e).toEqual(new Error("Unsupported Region"));
    }
  });

  test("openWebConsole - generates a valid aws url to log", async () => {
    const mockedSessionRegion = "eu-west-1";
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

    const federationUrl = "https://signin.aws.amazon.com/federation";
    const consoleHomeURL = `https://${mockedSessionRegion}.console.aws.amazon.com/console/home?region=${mockedSessionRegion}`;
    const signinToken = credentialsInfo.sessionToken.aws_session_token;
    const truthUrl = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${signinToken}`;

    const webConsoleService: WebConsoleService = getService();
    await webConsoleService.openWebConsole(credentialsInfo, mockedSessionRegion, mockedSessionDuration);
    expect((webConsoleService as any).shellService.openExternalUrl).toHaveBeenCalledWith(truthUrl);
  });
});
