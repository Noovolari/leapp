export class SessionDto {
  constructor(public sessionId: string, public protectedSessionKey: string, public encryptedSession: string, public lastUpdateTimestamp?: number) {}
}
