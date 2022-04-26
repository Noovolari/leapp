import { describe, test, expect, jest } from "@jest/globals";
import { RemoteCliMfaCodePromptService } from "./remote-cli-mfa-code-prompt-service";

describe("RemoteCliMfaCodePromptService", () => {
  test("promptForMFACode", async () => {
    const sessionName = "sessionName";
    const selectedMfaCode = "selectedMfaCode";
    const inquirer: any = {
      needMfa: (_: string) => Promise.resolve(selectedMfaCode),
    };
    const callbackFunction = jest.fn((mfaCode: string) => {
      expect(mfaCode).toEqual(selectedMfaCode);
    });

    const cliMfaCodePromptService = new RemoteCliMfaCodePromptService(inquirer);
    cliMfaCodePromptService.promptForMFACode(sessionName, callbackFunction);
    await Promise.all([inquirer.prompt]);
    expect(callbackFunction).toHaveBeenCalled();
  });
});
