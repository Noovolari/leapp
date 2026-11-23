/*
 * Regression baseline recorder. NOT a test: it writes the fixtures and golden files in test/regression/reference/
 * from the code it runs on (see the README in that folder). Re-recording replaces the baseline the regression
 * tests check against, so do it only on purpose.
 *
 *   REGRESSION_RECORD=baseline npx jest --testMatch '**' --coverage=false test/regression/record-baseline.ts
 */
import { afterEach, describe, expect, test } from "@jest/globals";
import * as fsExtra from "fs-extra";
import * as path from "path";
import {
  buildFixtureWorkspace,
  createNativeService,
  createTempHome,
  fixturePaths,
  mockAwsSdk,
  runLoadSave,
  runStartSessions,
  serializeWorkspace,
  workspaceNames,
} from "./regression-harness";
import { FileService } from "../../src/services/file-service";
import { SessionStatus } from "../../src/models/session-status";

const pretty = (json: string): string => JSON.stringify(JSON.parse(json), null, 2) + "\n";

const write = (file: string, content: string): void => {
  fsExtra.mkdirpSync(path.dirname(file));
  fsExtra.writeFileSync(file, content);
};

describe("regression baseline recorder", () => {
  let restore: () => void = () => {};

  afterEach(() => restore());

  test("records fixtures and golden outputs", async () => {
    if (process.env.REGRESSION_RECORD !== "baseline") {
      throw new Error("Set REGRESSION_RECORD=baseline to record. Re-recording the baseline needs a spec decision.");
    }

    for (const name of workspaceNames) {
      const plaintext = serializeWorkspace(buildFixtureWorkspace(name));
      write(fixturePaths.plaintext(name), pretty(plaintext));

      // AC7: ciphertext produced by the baseline crypto-js with the test key.
      write(fixturePaths.encrypted(name), new FileService(createNativeService(createTempHome())).encryptText(plaintext) + "\n");

      // AC4
      const loadSave = runLoadSave(createTempHome(), plaintext);
      expect(loadSave.errors).toEqual([]);
      write(fixturePaths.goldenAfterLoadSave(name), pretty(loadSave.savedPlaintext));

      // AC5
      restore = mockAwsSdk().restore;
      const started = await runStartSessions(createTempHome(), name, plaintext);
      restore();
      expect(started.errors).toEqual([]);
      expect(new Set(Object.values(started.statuses))).toEqual(new Set([SessionStatus.active]));
      write(fixturePaths.goldenAwsCredentials(name), started.credentials);
      write(fixturePaths.goldenAwsConfig(name), started.config);
    }
  });
});
