import { describe, test, expect, jest } from "@jest/globals";
import { LocalCliMfaCodePromptService } from "./local-cli-mfa-code-prompt-service";
import { of } from "rxjs";

describe("CliMfaCodePromptService", () => {
  test("promptForMFACode", async () => {
    const sessionName = "sessionName";
    const selectedMfaCode = "selectedMfaCode";
    const inquirer: any = {
      prompt: (param: any) => {
        expect(param).toEqual([
          {
            name: "mfaCode",
            message: `Insert MFA code for session ${sessionName}`,
            type: "input",
          },
        ]);
        return of({ mfaCode: selectedMfaCode }).toPromise();
      },
    };
    const callbackFunction = jest.fn((mfaCode: string) => {
      expect(mfaCode).toEqual(selectedMfaCode);
    });

    const cliMfaCodePromptService = new LocalCliMfaCodePromptService(inquirer);
    cliMfaCodePromptService.promptForMFACode(sessionName, callbackFunction);
    await Promise.all([inquirer.prompt]);
    expect(callbackFunction).toHaveBeenCalled();
  });
});
