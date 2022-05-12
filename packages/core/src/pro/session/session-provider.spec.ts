import { beforeEach, describe, expect, test } from "@jest/globals";
import { EncryptionProvider } from "../encryption/encryption.provider";
import { HttpClientMock } from "../test/http-client-mock";
import * as crypto from "crypto";
import { SessionProvider } from "./session-provider";
import { GetSessionsResponseDto } from "./dto/get-sessions-response-dto";
import { SessionDto } from "./dto/session-dto";
import { SetSessionsRequestDto } from "./dto/set-sessions-request-dto";

describe("SessionProvider", () => {
  let encryptionProvider: EncryptionProvider;
  let httpClientMock: HttpClientMock;
  let sessionProvider: SessionProvider;

  beforeEach(() => {
    httpClientMock = new HttpClientMock();
    encryptionProvider = new EncryptionProvider((crypto as any).webcrypto);
    sessionProvider = new SessionProvider("http://endpoint", httpClientMock, encryptionProvider);
  });

  test("GetSessions", async () => {
    const fakeSessionToGet = { id: "123", sessionType: "type1" };

    const rsaKeyPair = await encryptionProvider.generateRsaKeys();
    const cryptoKeyPair = await encryptionProvider.importRsaKeys(rsaKeyPair);
    const sharedSymmetricKeyString = await encryptionProvider.generateSymmetricKey();
    const sharedSymmetricKey = await encryptionProvider.importSymmetricKey(sharedSymmetricKeyString);
    const serializedSession = JSON.stringify(fakeSessionToGet);
    const encryptedSession = await encryptionProvider.aesEncrypt(serializedSession, sharedSymmetricKey);
    const protectedSharedSymmetricKey = await encryptionProvider.rsaEncrypt(sharedSymmetricKeyString, cryptoKeyPair.publicKey);
    httpClientMock.setReturnValue(new GetSessionsResponseDto([new SessionDto("1", protectedSharedSymmetricKey, encryptedSession)]));

    const actualResponse = await sessionProvider.getSessions(cryptoKeyPair.privateKey);
    expect(httpClientMock.called).toBe(true);
    expect(httpClientMock.methodCalled).toBe("GET");
    expect(httpClientMock.urlCalled).toBe("http://endpoint/session");
    expect(httpClientMock.sentBody).toBeUndefined();
    expect(actualResponse).toEqual([fakeSessionToGet]);
  });

  test("SetSessions", async () => {
    const fakeSessionToSet = { id: "123", sessionType: "type1" };
    const cryptoKeyPair = await encryptionProvider.importRsaKeys(await encryptionProvider.generateRsaKeys());

    await sessionProvider.setSessions(cryptoKeyPair.publicKey, [fakeSessionToSet]);
    expect(httpClientMock.called).toBe(true);
    expect(httpClientMock.methodCalled).toBe("PUT");
    expect(httpClientMock.urlCalled).toBe("http://endpoint/session");

    const requestDto = httpClientMock.sentBody as SetSessionsRequestDto;
    expect(requestDto.sessions.length).toBe(1);
    const protectedSession = requestDto.sessions[0];

    const sessionKeyString = await encryptionProvider.rsaDecrypt(protectedSession.protectedSessionKey, cryptoKeyPair.privateKey);
    const sessionKey = await encryptionProvider.importSymmetricKey(sessionKeyString);
    const actualSession = JSON.parse(await encryptionProvider.aesDecrypt(protectedSession.encryptedSession, sessionKey));
    expect(actualSession).toEqual(fakeSessionToSet);
  });
});
