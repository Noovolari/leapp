import { IMfaCodePrompter } from "@hesketh-racing/leapp-core/interfaces/i-mfa-code-prompter";
import { RemoteProceduresClient } from "@hesketh-racing/leapp-core/services/remote-procedures-client";

export class RemoteCliMfaCodePromptService implements IMfaCodePrompter {
  constructor(private remoteProcedureClient: RemoteProceduresClient) {}

  promptForMFACode(sessionName: string, callback: (code: string) => void): void {
    this.remoteProcedureClient.needMfa(sessionName).then((code: string) => {
      callback(code);
    });
  }
}
