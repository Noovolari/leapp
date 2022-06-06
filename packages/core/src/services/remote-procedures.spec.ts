import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import { RemoteProceduresServer } from "./remote-procedures-server";
import * as ipc from "node-ipc";
import { RemoteProceduresClient } from "./remote-procedures-client";
import { Workspace } from "../models/workspace";

describe("RemoteProcedures", () => {
  let nativeService;
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
    const testId = `rpc_test${Math.random() * 10000}`;
    client = new RemoteProceduresClient(nativeService as any, testId);
    server = new RemoteProceduresServer(nativeService as any, null, null, null, null, null, (f) => f(), testId);
  });

  test("isDesktopAppRunning, server not running", async () => {
    expect(await client.isDesktopAppRunning()).toBe(false);
  });

  test("isDesktopAppRunning, server running", async () => {
    server.startServer();
    await retry(async () => expect(await client.isDesktopAppRunning()).toBe(true));
    server.stopServer();
  });

  test("refreshSessions, server not running", async () => {
    await expect(client.refreshSessions()).rejects.toEqual("unable to connect with desktop app");
  });

  test("refreshSessions, server running", async () => {
    const sessions = ["session1"];
    const repository = { reloadWorkspace: jest.fn(), getSessions: () => sessions } as any;
    const behaviouralSubjectService = { setSessions: jest.fn() } as any;
    (server as any).repository = repository;
    (server as any).behaviouralSubjectService = behaviouralSubjectService;
    server.startServer();

    await retry(async () => {
      await client.refreshSessions();
      expect(repository.reloadWorkspace).toHaveBeenCalled();
      expect(behaviouralSubjectService.setSessions).toHaveBeenCalledWith(sessions);
    });

    server.stopServer();
  });

  test("refreshSessions, server throwing", async () => {
    const repository = {
      reloadWorkspace: () => {
        throw new Error("unexpected error");
      },
    } as any;
    (server as any).repository = repository;
    server.startServer();

    await retry(async () => {
      await expect(client.refreshSessions()).rejects.toEqual("unexpected error");
    });

    server.stopServer();
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
    (server as any).repository = repository;
    (server as any).behaviouralSubjectService = behaviouralSubjectService;
    server.startServer();

    await retry(async () => {
      await client.refreshIntegrations();
      expect(repository.reloadWorkspace).toHaveBeenCalled();
      expect(repository.persistWorkspace).toHaveBeenCalled();
    });

    server.stopServer();
  });

  test("refreshIntegrations, server throwing", async () => {
    const repository = {
      reloadWorkspace: () => {
        throw new Error("unexpected error");
      },
    } as any;
    (server as any).repository = repository;
    server.startServer();

    await retry(async () => {
      await expect(client.refreshIntegrations()).rejects.toEqual("unexpected error");
    });

    server.stopServer();
  });
});
