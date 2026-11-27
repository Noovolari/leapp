import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import {
  AuthorizationPendingException,
  CreateTokenCommand,
  ExpiredTokenException,
  RegisterClientCommand,
  SSOOIDCClient,
  StartDeviceAuthorizationCommand,
} from "@aws-sdk/client-sso-oidc";
import { AwsSsoOidcService } from "./aws-sso-oidc.service";
import { Repository } from "./repository";
import { FileService } from "./file-service";
import { Workspace } from "../models/workspace";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";
import { constants } from "../models/constants";
import { IAwsSsoOidcVerificationWindowService } from "../interfaces/i-aws-sso-oidc-verification-window-service";
import { RegisterClientResponse, StartDeviceAuthorizationResponse, VerificationResponse } from "./session/aws/aws-sso-role-service";

const ssoOidcMock = mockClient(SSOOIDCClient);

const integrationId = "integration-1";
const portalUrl = "https://d-111.awsapps.com/start";
const region = "eu-west-1";
const start = new Date("2026-11-27T10:00:00.000Z");

const pending = (): AuthorizationPendingException => new AuthorizationPendingException({ $metadata: {}, message: "pending" });
const expired = (): ExpiredTokenException => new ExpiredTokenException({ $metadata: {}, message: "expired" });

/** Fake of the client-specific window service (Electron / browser), the boundary core talks to. */
class FakeVerificationWindow implements IAwsSsoOidcVerificationWindowService {
  readonly events: string[] = [];
  readonly modalities: string[] = [];
  onWindowClose: (error?: string) => void;

  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    onWindowClose: (error?: string) => void
  ): Promise<VerificationResponse> {
    this.events.push("open");
    this.modalities.push(windowModality);
    this.onWindowClose = onWindowClose;
    return {
      clientId: registerClientResponse.clientId,
      clientSecret: registerClientResponse.clientSecret,
      deviceCode: startDeviceAuthorizationResponse.deviceCode,
    };
  }

  closeVerificationWindow(): void {
    this.events.push("close");
  }
}

/** Same, for a client that cannot close the page (the user's browser). */
class FakeBrowserOnlyWindow implements IAwsSsoOidcVerificationWindowService {
  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse
  ): Promise<VerificationResponse> {
    return {
      clientId: registerClientResponse.clientId,
      clientSecret: registerClientResponse.clientSecret,
      deviceCode: startDeviceAuthorizationResponse.deviceCode,
    };
  }
}

const repositoryWith = (browserOpening: string): Repository => {
  const nativeService: any = { os: { homedir: () => "/home/leapp-test" } };
  // The lock file is the disk boundary: it "exists" and is never written in these tests.
  const fileService = new FileService(nativeService);
  fileService.existsSync = (() => true) as any;
  fileService.writeFileSync = jest.fn() as any;
  const workspace = new Workspace();
  workspace.awsSsoIntegrations.push(new AwsSsoIntegration(integrationId, "Company SSO", portalUrl, region, browserOpening, undefined));
  const repository = new Repository(nativeService, fileService, { getWorkspace: () => workspace } as any);
  repository.workspace = workspace;
  return repository;
};

const createTokenCalls = () => ssoOidcMock.commandCalls(CreateTokenCommand);

describe("AwsSsoOidcService login", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: start });
    ssoOidcMock.reset();
    ssoOidcMock.on(RegisterClientCommand).resolves({ clientId: "client-id", clientSecret: "client-secret" });
    ssoOidcMock.on(StartDeviceAuthorizationCommand).resolves({
      deviceCode: "device-code",
      userCode: "ABCD-EFGH",
      verificationUri: "https://device.sso.eu-west-1.amazonaws.com/",
      verificationUriComplete: "https://device.sso.eu-west-1.amazonaws.com/?user_code=ABCD-EFGH",
      expiresIn: 600,
      interval: 1,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("In-app login polls CreateToken every 5 s until the token, then closes the window before resolving", async () => {
    ssoOidcMock.on(CreateTokenCommand).rejectsOnce(pending()).rejectsOnce(pending()).resolves({ accessToken: "access-token", expiresIn: 3600 });
    const window = new FakeVerificationWindow();
    const service = new AwsSsoOidcService(window, repositoryWith(constants.inApp));

    const login = service.login(integrationId, region, portalUrl).then((token) => {
      window.events.push("resolved");
      return token;
    });
    login.catch(() => {});

    await jest.advanceTimersByTimeAsync(4_999);
    expect(createTokenCalls()).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1);
    expect(createTokenCalls()).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(login).resolves.toEqual({ accessToken: "access-token", expirationTime: new Date("2026-11-27T11:00:15.000Z") });
    expect(createTokenCalls()).toHaveLength(3);
    expect(createTokenCalls()[0].args[0].input).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
      grantType: "urn:ietf:params:oauth:grant-type:device_code",
      deviceCode: "device-code",
    });
    expect(window.modalities).toEqual([constants.inApp]);
    expect(window.events).toEqual(["open", "close", "resolved"]);
  });

  test("an expired device code stops the polling, closes the window and rejects with the timeout message", async () => {
    ssoOidcMock.on(CreateTokenCommand).rejectsOnce(pending()).rejects(expired());
    const window = new FakeVerificationWindow();
    const service = new AwsSsoOidcService(window, repositoryWith(constants.inApp));

    const login = service.login(integrationId, region, portalUrl);
    const outcome = login.then(
      () => "resolved",
      (error) => error.message
    );

    await jest.advanceTimersByTimeAsync(10_000);
    expect(await outcome).toBe("AWS SSO Timeout occurred. Please redo login procedure.");
    await jest.advanceTimersByTimeAsync(30_000);
    expect(createTokenCalls()).toHaveLength(2);
    expect(window.events).toEqual(["open", "close"]);
  });

  test("In-browser login keeps polling and works with a window service that cannot close the page", async () => {
    ssoOidcMock.on(CreateTokenCommand).rejectsOnce(pending()).resolves({ accessToken: "browser-token", expiresIn: 28_800 });
    const service = new AwsSsoOidcService(new FakeBrowserOnlyWindow(), repositoryWith(constants.inBrowser));

    const login = service.login(integrationId, region, portalUrl);
    login.catch(() => {});
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(login).resolves.toEqual({ accessToken: "browser-token", expirationTime: new Date("2026-11-27T18:00:10.000Z") });
    expect(createTokenCalls()).toHaveLength(2);
  });

  test("a user close stops the polling, rejects the login and its waiters with AWS SSO Interrupted., and a new login starts over", async () => {
    ssoOidcMock.on(CreateTokenCommand).rejects(pending());
    const window = new FakeVerificationWindow();
    const service = new AwsSsoOidcService(window, repositoryWith(constants.inApp));
    const listener = {
      closed: 0,
      catchClosingBrowserWindow(): void {
        this.closed++;
      },
    };
    service.appendListener(listener);

    const outcome = (promise: Promise<unknown>) =>
      promise.then(
        () => "resolved",
        (error) => error.message
      );
    const first = outcome(service.login(integrationId, region, portalUrl));
    await jest.advanceTimersByTimeAsync(0);
    const second = outcome(service.login(integrationId, region, portalUrl));
    await jest.advanceTimersByTimeAsync(5_000);
    expect(createTokenCalls()).toHaveLength(1);

    window.onWindowClose();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(await first).toBe("AWS SSO Interrupted.");
    expect(await second).toBe("AWS SSO Interrupted.");
    expect(createTokenCalls()).toHaveLength(1);
    expect(listener.closed).toBe(1);

    const third = outcome(service.login(integrationId, region, portalUrl));
    await jest.advanceTimersByTimeAsync(0);
    expect(ssoOidcMock.commandCalls(RegisterClientCommand)).toHaveLength(2);
    window.onWindowClose();
    await jest.advanceTimersByTimeAsync(1_000);
    expect(await third).toBe("AWS SSO Interrupted.");
  });

  test("a page load error reported by the window stops the polling and fails the login with that error", async () => {
    ssoOidcMock.on(CreateTokenCommand).rejects(pending());
    const window = new FakeVerificationWindow();
    const service = new AwsSsoOidcService(window, repositoryWith(constants.inApp));

    const outcome = service.login(integrationId, region, portalUrl).then(
      () => "resolved",
      (error) => error.message
    );
    await jest.advanceTimersByTimeAsync(5_000);
    window.onWindowClose("net::ERR_NAME_NOT_RESOLVED");
    await jest.advanceTimersByTimeAsync(30_000);

    expect(await outcome).toBe("net::ERR_NAME_NOT_RESOLVED");
    expect(createTokenCalls()).toHaveLength(1);
  });
});
