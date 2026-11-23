import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import * as fsExtra from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as ipc from "node-ipc";
import {
  createCore,
  createTempHome,
  fixturePaths,
  ids,
  InMemoryKeychain,
  installEncryptedWorkspace,
  mockAwsSdk,
  seedKeychain,
} from "../regression/regression-harness";
import { SessionType } from "../../src/models/session-type";
import { RemoteProceduresServer } from "../../src/services/remote-procedures-server";
import { RemoteProceduresClient } from "../../src/services/remote-procedures-client";

const read = (file: string): string => fsExtra.readFileSync(file, "utf-8");
const savedVariables = ["LEAPP_FLAVOR", "AWS_SHARED_CREDENTIALS_FILE", "AWS_CONFIG_FILE"];

/** Records the keychain service name of every call, so a test can assert which service a flavor uses. */
class RecordingKeychain extends InMemoryKeychain {
  readonly services = new Set<string>();

  async saveSecret(service: string, account: string, password: string): Promise<void> {
    this.services.add(service);
    return super.saveSecret(service, account, password);
  }

  async getSecret(service: string, account: string): Promise<string | null> {
    this.services.add(service);
    return super.getSecret(service, account);
  }

  async deleteSecret(service: string, account: string): Promise<boolean> {
    this.services.add(service);
    return super.deleteSecret(service, account);
  }
}

describe("build flavors", () => {
  let homeDir: string;
  let awsDir: string;
  let saved: Record<string, string | undefined>;

  const useFlavor = (flavor: "prod" | "dev" | undefined): void => {
    if (flavor === undefined) {
      delete process.env.LEAPP_FLAVOR;
    } else {
      process.env.LEAPP_FLAVOR = flavor;
    }
  };

  /** Points the AWS standard variables at a sandbox holding the same initial files the regression baseline uses. */
  const useAwsSandbox = (): { credentials: string; config: string } => {
    const credentials = path.join(awsDir, "credentials");
    const config = path.join(awsDir, "config");
    fsExtra.copyFileSync(fixturePaths.initialAwsCredentials, credentials);
    fsExtra.copyFileSync(fixturePaths.initialAwsConfig, config);
    process.env.AWS_SHARED_CREDENTIALS_FILE = credentials;
    process.env.AWS_CONFIG_FILE = config;
    return { credentials, config };
  };

  beforeEach(() => {
    saved = Object.fromEntries(savedVariables.map((name) => [name, process.env[name]]));
    savedVariables.forEach((name) => delete process.env[name]);
    homeDir = createTempHome();
    awsDir = fsExtra.mkdtempSync(path.join(os.tmpdir(), "ls-150-aws-"));
  });

  afterEach(() => {
    savedVariables.forEach((name) => (saved[name] === undefined ? delete process.env[name] : (process.env[name] = saved[name])));
    fsExtra.removeSync(homeDir);
    fsExtra.removeSync(awsDir);
  });

  describe("workspace location", () => {
    test("the dev flavor creates its workspace under ~/.Leapp-dev and never creates ~/.Leapp", () => {
      useFlavor("dev");

      createCore(homeDir, new InMemoryKeychain());

      expect(fsExtra.existsSync(path.join(homeDir, ".Leapp-dev", "Leapp-lock.json"))).toBe(true);
      expect(fsExtra.existsSync(path.join(homeDir, ".Leapp"))).toBe(false);
    });

    test("the prod flavor keeps its workspace under ~/.Leapp and never creates ~/.Leapp-dev", () => {
      useFlavor(undefined);

      createCore(homeDir, new InMemoryKeychain());

      expect(fsExtra.existsSync(path.join(homeDir, ".Leapp", "Leapp-lock.json"))).toBe(true);
      expect(fsExtra.existsSync(path.join(homeDir, ".Leapp-dev"))).toBe(false);
    });
  });

  describe("AWS files from the standard variables", () => {
    test.each(["prod", "dev"] as const)(
      "flavor %s writes and removes the session profile in AWS_SHARED_CREDENTIALS_FILE, never in $HOME/.aws",
      async (flavor) => {
        useFlavor(flavor);
        const sandbox = useAwsSandbox();
        installEncryptedWorkspace(homeDir, read(fixturePaths.plaintext("credential-file")));
        const keychain = new InMemoryKeychain();
        await seedKeychain(keychain);
        const core = createCore(homeDir, keychain);
        const sdk = mockAwsSdk();
        try {
          const service = core.sessionFactory.getSessionService(SessionType.awsIamUser);

          await service.start(ids.sessionIamUser);
          const started = read(sandbox.credentials);
          await service.stop(ids.sessionIamUser);
          const stopped = read(sandbox.credentials);

          expect(started).toContain("[ls-iam-user]");
          expect(started).toContain("aws_access_key_id=ASIAIAMUSEREXAMPLE");
          expect(started).toContain("[foreign-static]");
          expect(stopped).not.toContain("[ls-iam-user]");
          expect(stopped).toContain("[foreign-static]");
          expect(fsExtra.existsSync(path.join(homeDir, ".aws", "credentials"))).toBe(false);
          expect(fsExtra.existsSync(path.join(homeDir, ".aws", "config"))).toBe(false);
        } finally {
          sdk.restore();
        }
      }
    );
  });

  describe("credential_process command", () => {
    test.each([
      ["dev", "credential_process=leapp-dev session generate session-iam-user"],
      ["prod", "credential_process=leapp session generate session-iam-user"],
    ] as const)("flavor %s writes %s into the AWS config", async (flavor, expectedLine) => {
      useFlavor(flavor);
      const sandbox = useAwsSandbox();
      installEncryptedWorkspace(homeDir, read(fixturePaths.plaintext("credential-process")));
      const keychain = new InMemoryKeychain();
      await seedKeychain(keychain);
      const core = createCore(homeDir, keychain);
      const sdk = mockAwsSdk();
      try {
        await core.sessionFactory.getSessionService(SessionType.awsIamUser).start(ids.sessionIamUser);

        const config = read(sandbox.config);
        expect(config).toContain("[profile ls-iam-user]");
        expect(config.split("\n")).toContain(expectedLine);
      } finally {
        sdk.restore();
      }
    });
  });

  describe("keychain service", () => {
    test("in the dev flavor core saves and reads IAM user secrets under the Leapp-dev service only", async () => {
      useFlavor("dev");
      useAwsSandbox();
      const keychain = new RecordingKeychain();
      const core = createCore(homeDir, keychain);
      const service = core.sessionFactory.getSessionService(SessionType.awsIamUser);
      const sdk = mockAwsSdk();
      try {
        await service.create({
          sessionId: "ls-150-iam-user",
          sessionName: "flavor iam user",
          region: "eu-west-1",
          profileId: core.repository.getDefaultProfileId(),
          accessKey: "AKIALS150EXAMPLE",
          secretKey: "ls-150-secret-access-key-example",
        } as any);

        expect([...keychain.services]).toEqual(["Leapp-dev"]);
        expect(keychain.store.get("Leapp-dev/ls-150-iam-user-iam-user-aws-session-access-key-id")).toBe("AKIALS150EXAMPLE");

        await service.start("ls-150-iam-user");

        expect([...keychain.services]).toEqual(["Leapp-dev"]);
        expect([...keychain.store.keys()].filter((key) => key.startsWith("Leapp/"))).toEqual([]);
      } finally {
        sdk.restore();
      }
    });
  });

  describe("CLI ↔ desktop socket", () => {
    let socketRoot: string;
    let savedSocketRoot: string;
    let server: RemoteProceduresServer;

    const startServer = (flavor: "prod" | "dev"): void => {
      useFlavor(flavor);
      server = new RemoteProceduresServer(null, { nodeIpc: ipc } as any, null, null, null, null, null, null, null, null, (f) => f());
      server.startServer();
    };

    const clientIsConnected = async (flavor: "prod" | "dev"): Promise<boolean> => {
      useFlavor(flavor);
      const client = new RemoteProceduresClient({ nodeIpc: ipc } as any);
      // the server needs a moment to listen; a matching client connects within a few attempts
      for (let attempt = 0; attempt < 20; attempt++) {
        if (await client.isDesktopAppRunning()) {
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return false;
    };

    beforeEach(() => {
      // a private socket root, so the test never reaches a Leapp running on this machine
      savedSocketRoot = (ipc as any).config.socketRoot;
      socketRoot = fsExtra.mkdtempSync(path.join(os.tmpdir(), "ls-150-ipc-")) + path.sep;
      (ipc as any).config.socketRoot = socketRoot;
      server = null;
    });

    afterEach(() => {
      server?.stopServer();
      (ipc as any).config.socketRoot = savedSocketRoot;
      fsExtra.removeSync(socketRoot);
    });

    test("a dev CLI and a dev desktop app talk over the dev socket, with the dev client id", async () => {
      startServer("dev");

      expect(await clientIsConnected("dev")).toBe(true);
      expect((ipc as any).config.id).toBe("leapp_cli-dev");
    });

    test("a prod CLI does not reach a dev desktop app", async () => {
      startServer("dev");

      expect(await clientIsConnected("prod")).toBe(false);
    }, 20000);

    test("a dev CLI does not reach a prod desktop app", async () => {
      startServer("prod");

      expect(await clientIsConnected("dev")).toBe(false);
    }, 20000);
  });
});
