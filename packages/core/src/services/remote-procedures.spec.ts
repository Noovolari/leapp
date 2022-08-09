import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { RemoteProceduresServer } from "./remote-procedures-server";
import * as ipc from "node-ipc";
import { RemoteProceduresClient } from "./remote-procedures-client";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";

describe("RemoteProcedures", () => {
  let nativeService;
  let testId;
  let client: RemoteProceduresClient;
  let server: RemoteProceduresServer;

  const retry = async (expectation) =>
    new Promise((resolve, reject) => {
      let retries = 0;
      const handle = setInterval(async () => {
        try {
          await expectation();
          clearInterval(handle);
          resolve(undefined);
        } catch (error) {
          if (retries++ > 300) {
            clearInterval(handle);
            reject(error);
          }
        }
      }, 10);
    });

  beforeEach(() => {
    nativeService = { nodeIpc: ipc };
    server = null;
    testId = `rpc_test${Math.random() * 10000}`;
    client = new RemoteProceduresClient(nativeService as any, testId);
  });

  afterEach(() => {
    if (server) {
      server.stopServer();
    }
  });

  const startServer = () => {
    server = new RemoteProceduresServer(nativeService as any, null, null, null, null, null, null, (f) => f(), testId);
    server.startServer();
  };

  test("server default id", async () => {
    const server2 = new RemoteProceduresServer(null, null, null, null, null, null, null, null);
    expect((server2 as any).serverId).toBe(constants.ipcServerId);
  });

  test("client default id", async () => {
    const client2 = new RemoteProceduresClient(null);
    expect((client2 as any).serverId).toBe(constants.ipcServerId);
  });

  test("method not allowed by the server", async () => {
    startServer();
    await retry(async () => {
      expect(await client.isDesktopAppRunning()).toBe(true);
      await expect(
        client.remoteProcedureCall(
          { method: "methodNotExistent", params: {} },
          (data, resolve, reject) => reject(data),
          (_, reject) => reject("disconnected")
        )
      ).rejects.toEqual("disconnected");
    });
  });

  test("isDesktopAppRunning, server not running", async () => {
    expect(await client.isDesktopAppRunning()).toBe(false);
  });

  test("isDesktopAppRunning, server running", async () => {
    startServer();
    await retry(async () => expect(await client.isDesktopAppRunning()).toBe(true));
  });

  test("needAuthentication, server not running", async () => {
    await expect(client.needAuthentication("fakeIdpUrl")).rejects.toEqual("unable to connect with desktop app");
  });

  test("needAuthentication, authentication needed", async () => {
    const awsAuthenticationService = {
      needAuthentication: jest.fn(async () => true),
    };
    startServer();
    (server as any).awsAuthenticationService = awsAuthenticationService;

    await retry(async () => {
      const fakeIdpUrl = "fakeIdpUrl";
      expect(await client.needAuthentication(fakeIdpUrl)).toBe(true);
      expect(awsAuthenticationService.needAuthentication).toHaveBeenCalledWith(fakeIdpUrl);
    });
  });

  test("needAuthentication, throwing error", async () => {
    const fakeError = "fakeError";
    const awsAuthenticationService = {
      needAuthentication: jest.fn(async () => {
        throw new Error(fakeError);
      }),
    };
    startServer();
    (server as any).awsAuthenticationService = awsAuthenticationService;

    await retry(async () => {
      await expect(client.needAuthentication("fakeIdpUrl")).rejects.toEqual(fakeError);
    });
  });

  test("needMfa, server not running", async () => {
    await expect(client.needMfa("sessionId")).rejects.toEqual("unable to connect with desktop app");
  });

  test("needMfa, returns mfa code", async () => {
    const fakeMfaCode = "mfaCode";
    const fakeSessionId = "sessionId";
    const mfaCodePrompter = {
      promptForMFACode: jest.fn((sessionId, callback: any) => {
        expect(sessionId).toBe(fakeSessionId);
        callback(fakeMfaCode);
      }),
    };
    startServer();
    (server as any).mfaCodePrompter = mfaCodePrompter;

    await retry(async () => {
      expect(await client.needMfa(fakeSessionId)).toBe(fakeMfaCode);
      expect(mfaCodePrompter.promptForMFACode).toHaveBeenCalled();
    });
  });

  test("needMfa, throwing error", async () => {
    const fakeSessionId = "sessionId";
    const fakeError = "fakeError";
    const mfaCodePrompter = {
      promptForMFACode: (_, __: any) => {
        throw new Error(fakeError);
      },
    };
    startServer();
    (server as any).mfaCodePrompter = mfaCodePrompter;

    await retry(async () => {
      await expect(client.needMfa(fakeSessionId)).rejects.toEqual(fakeError);
    });
  });

  test("awsSignIn, server not running", async () => {
    await expect(client.awsSignIn("fakeIdpUrl", false)).rejects.toEqual("unable to connect with desktop app");
  });

  test("awsSignIn, signedIn", async () => {
    const fakeSamlResponse = "fakeSamlResponse";
    const awsAuthenticationService = {
      awsSignIn: jest.fn(async () => fakeSamlResponse),
    };
    startServer();
    (server as any).awsAuthenticationService = awsAuthenticationService;

    await retry(async () => {
      const fakeIdpUrl = "fakeIdpUrl";
      const fakeNeedAuthentication = false;
      expect(await client.awsSignIn(fakeIdpUrl, fakeNeedAuthentication)).toBe(fakeSamlResponse);
      expect(awsAuthenticationService.awsSignIn).toHaveBeenCalledWith(fakeIdpUrl, fakeNeedAuthentication);
    });
  });

  test("awsSignIn, throwing error", async () => {
    const fakeError = "fakeError";
    const awsAuthenticationService = {
      awsSignIn: jest.fn(async () => {
        throw new Error(fakeError);
      }),
    };
    startServer();
    (server as any).awsAuthenticationService = awsAuthenticationService;

    await retry(async () => {
      await expect(client.awsSignIn("fakeIdpUrl", false)).rejects.toEqual(fakeError);
    });
  });

  test("openVerificationWindow, server not running", async () => {
    await expect(client.openVerificationWindow(null, null, null, null)).rejects.toEqual("unable to connect with desktop app");
  });

  test("openVerificationWindow, returns", async () => {
    const fakeVerificationResponse = "fakeVerificationResponse";
    const fakeRegisterClientResponse: any = "fakeRegisterClientResponse";
    const fakeStartDeviceAuthorizationResponse: any = "fakeStartDeviceAuthorizationResponse";
    const fakeWindowModality = "fakeWindowModality";

    const verificationWindowService = {
      openVerificationWindow: jest.fn(async (registerClientResponse, startDeviceAuthorizationResponse, windowModality, onWindowClose: () => void) => {
        expect(registerClientResponse).toBe(fakeRegisterClientResponse);
        expect(startDeviceAuthorizationResponse).toBe(fakeStartDeviceAuthorizationResponse);
        expect(windowModality).toBe(fakeWindowModality);
        onWindowClose();
        return fakeVerificationResponse;
      }),
    };
    startServer();
    (server as any).verificationWindowService = verificationWindowService;

    await retry(async () => {
      const callbackMock = jest.fn();
      expect(
        await client.openVerificationWindow(fakeRegisterClientResponse, fakeStartDeviceAuthorizationResponse, fakeWindowModality, callbackMock)
      ).toBe(fakeVerificationResponse);
      expect(callbackMock).toHaveBeenCalled();
      expect(verificationWindowService.openVerificationWindow).toHaveBeenCalled();
    });
  });

  test("openVerificationWindow, throwing error", async () => {
    const fakeError = "fakeError";
    const verificationWindowService = {
      openVerificationWindow: jest.fn(async () => {
        throw new Error(fakeError);
      }),
    };
    startServer();
    (server as any).verificationWindowService = verificationWindowService;

    await retry(async () => {
      await expect(client.openVerificationWindow(null, null, null, null)).rejects.toEqual(fakeError);
    });
  });

  test("refreshSessions, server not running", async () => {
    await expect(client.refreshSessions()).rejects.toEqual("unable to connect with desktop app");
  });

  test("refreshSessions, server running", async () => {
    const sessions = ["session1"];
    const repository = { reloadWorkspace: jest.fn(), getSessions: () => sessions } as any;
    const behaviouralSubjectService = { setSessions: jest.fn() } as any;
    startServer();
    (server as any).repository = repository;
    (server as any).behaviouralSubjectService = behaviouralSubjectService;

    await retry(async () => {
      await client.refreshSessions();
      expect(repository.reloadWorkspace).toHaveBeenCalled();
      expect(behaviouralSubjectService.setSessions).toHaveBeenCalledWith(sessions);
    });
  });

  test("refreshSessions, server throwing", async () => {
    const repository = {
      reloadWorkspace: () => {
        throw new Error("unexpected error");
      },
    } as any;
    startServer();
    (server as any).repository = repository;

    await retry(async () => {
      await expect(client.refreshSessions()).rejects.toEqual("unexpected error");
    });
  });

  test("refreshIntegrations, server not running", async () => {
    await expect(client.refreshIntegrations()).rejects.toEqual("unable to connect with desktop app");
  });

  test("refreshIntegrations, server running", async () => {
    const integrations = ["integration1"];
    const repository = {
      persistWorkspace: jest.fn(),
      reloadWorkspace: jest.fn(),
      getWorkspace: jest.fn(() => new Workspace()),
      listAwsSsoIntegrations: () => integrations,
    } as any;
    const behaviouralSubjectService = { setSessions: jest.fn(), setIntegrations: jest.fn() } as any;
    startServer();
    (server as any).repository = repository;
    (server as any).behaviouralSubjectService = behaviouralSubjectService;

    await retry(async () => {
      await client.refreshIntegrations();
      expect(repository.reloadWorkspace).toHaveBeenCalled();
      expect(repository.persistWorkspace).toHaveBeenCalled();
    });
  });

  test("refreshIntegrations, server throwing", async () => {
    const repository = {
      reloadWorkspace: () => {
        throw new Error("unexpected error");
      },
    } as any;
    startServer();
    (server as any).repository = repository;

    await retry(async () => {
      await expect(client.refreshIntegrations()).rejects.toEqual("unexpected error");
    });
  });
});
