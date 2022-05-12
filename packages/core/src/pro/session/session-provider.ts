import { HttpClientInterface } from "../http/HttpClientInterface";
import { EncryptionProvider } from "../encryption/encryption.provider";
import { SessionDto } from "./dto/session-dto";
import { GetSessionsResponseDto } from "./dto/get-sessions-response-dto";
import { SetSessionsRequestDto } from "./dto/set-sessions-request-dto";

export class SessionProvider {
  constructor(
    private readonly apiEndpoint: string,
    private readonly httpClient: HttpClientInterface,
    private readonly encryptionProvider: EncryptionProvider
  ) {}

  async getSessions(privateRSAKey: CryptoKey): Promise<any[]> {
    const responseDto = await this.httpClient.get<GetSessionsResponseDto>(`${this.apiEndpoint}/session`);
    const sessionsPromises = responseDto.sessions.map(async (encryptedSession) => {
      const sharedSymmetricKeyString = await this.encryptionProvider.rsaDecrypt(encryptedSession.protectedSessionKey, privateRSAKey);
      const sharedSymmetricKey = await this.encryptionProvider.importSymmetricKey(sharedSymmetricKeyString);
      const serializedSession = await this.encryptionProvider.aesDecrypt(encryptedSession.encryptedSession, sharedSymmetricKey);
      return JSON.parse(serializedSession);
    });
    return await Promise.all(sessionsPromises);
  }

  async setSessions(publicRSAKey: CryptoKey, sessions: any[]): Promise<void> {
    const serializedSessionsPromises = sessions.map(async (session) => {
      const sharedSymmetricKeyString = await this.encryptionProvider.generateSymmetricKey();
      const sharedSymmetricKey = await this.encryptionProvider.importSymmetricKey(sharedSymmetricKeyString);
      const serializedSession = JSON.stringify(session);
      const encryptedSession = await this.encryptionProvider.aesEncrypt(serializedSession, sharedSymmetricKey);
      const protectedSharedSymmetricKey = await this.encryptionProvider.rsaEncrypt(sharedSymmetricKeyString, publicRSAKey);
      return new SessionDto(session.id, protectedSharedSymmetricKey, encryptedSession);
    });
    const serializedSessions = await Promise.all(serializedSessionsPromises);
    await this.httpClient.put(`${this.apiEndpoint}/session`, new SetSessionsRequestDto(serializedSessions));
  }
}
