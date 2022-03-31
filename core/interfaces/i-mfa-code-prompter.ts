export interface IMfaCodePrompter {
  promptForMFACode(sessionName: string, callback: any): void;
}
