import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import * as fsExtra from "fs-extra";
import {
  createCore,
  createTempHome,
  fixturePaths,
  InMemoryKeychain,
  lockFilePath,
  mockAwsSdk,
  runLoadSave,
  runStartSessions,
  serializeWorkspace,
  testMachineId,
  workspaceNames,
} from "./regression-harness";
import { FileService } from "../../src/services/file-service";
import { SessionStatus } from "../../src/models/session-status";

const read = (file: string): string => fsExtra.readFileSync(file, "utf-8");

describe("workspace regression baseline", () => {
  let homeDir: string;

  beforeEach(() => {
    homeDir = createTempHome();
  });

  afterEach(() => {
    fsExtra.removeSync(homeDir);
  });

  describe.each(workspaceNames)("workspace %s", (name) => {
    test("loading and saving the encrypted workspace keeps its content", () => {
      const result = runLoadSave(homeDir, read(fixturePaths.plaintext(name)));

      expect(result.errors).toEqual([]);
      expect(JSON.parse(result.savedPlaintext)).toEqual(JSON.parse(read(fixturePaths.goldenAfterLoadSave(name))));
      // The ciphertext has a random salt: it must not be the plaintext, and is never compared byte for byte.
      expect(read(lockFilePath(homeDir))).not.toContain("_sessions");
    });

    test("starting every AWS and LocalStack session writes the recorded ~/.aws files and keeps foreign sections", async () => {
      const sdk = mockAwsSdk();
      try {
        const result = await runStartSessions(homeDir, name, read(fixturePaths.plaintext(name)));

        expect(result.errors).toEqual([]);
        expect(new Set(Object.values(result.statuses))).toEqual(new Set([SessionStatus.active]));
        expect(result.credentials).toBe(read(fixturePaths.goldenAwsCredentials(name)));
        expect(result.config).toBe(read(fixturePaths.goldenAwsConfig(name)));
      } finally {
        sdk.restore();
      }
    });

    test("a lock file encrypted by the baseline code still decrypts and loads", () => {
      const ciphertext = read(fixturePaths.encrypted(name));
      const expected = JSON.parse(read(fixturePaths.plaintext(name)));

      const fileService = new FileService({ machineId: testMachineId } as any);
      expect(JSON.parse(fileService.decryptText(ciphertext))).toEqual(expected);

      fsExtra.mkdirpSync(`${homeDir}/.Leapp`);
      fsExtra.writeFileSync(lockFilePath(homeDir), ciphertext);
      const core = createCore(homeDir, new InMemoryKeychain());
      expect(JSON.parse(serializeWorkspace(core.repository.getWorkspace()))).toEqual(expected);
      expect(core.logger.errors()).toEqual([]);
    });
  });
});
