import { EncryptionProvider } from "./encryption.provider";
import { describe, expect, test, beforeEach } from "@jest/globals";
import * as crypto from "crypto";

describe("EncryptionProvider with node.js crypto", () => {
  let encryptionService: EncryptionProvider;

  beforeEach(() => {
    encryptionService = new EncryptionProvider((crypto as any).webcrypto);
  });

  test(`Hash`, async () => {
    const secret = "secret";
    const salt = "salt";

    const hash1 = await encryptionService.hash(secret, salt);
    const hash2 = await encryptionService.hash(secret, salt);
    const hash3 = await encryptionService.hash("different secret", salt);
    const hash4 = await encryptionService.hash(secret, "different hash");

    expect(hash1).toBe("3745e482c6e0ade35da10139e797157f4a5da669dad7d5da88ef87e47471cc47");
    expect(hash1).toEqual(hash2);
    expect(hash1).not.toEqual(hash3);
    expect(hash1).not.toEqual(hash4);
  });

  test(`GenerateSymmetricKey`, async () => {
    const key1 = await encryptionService.generateSymmetricKey();
    const key2 = await encryptionService.generateSymmetricKey();

    expect(key1).not.toBeNull();
    expect(key1.length).toBe(64);
    expect(key2).not.toBeNull();
    expect(key2.length).toBe(64);
    expect(key1).not.toEqual(key2);
  });

  test(`AES - Encrypt & Decrypt with key derivation`, async () => {
    const secret = "secret".repeat(100);
    const key = "AES key";

    const encryptedData1 = await encryptionService.aesEncrypt(secret, key);
    const encryptedData2 = await encryptionService.aesEncrypt(secret, key);
    const encryptedData3 = await encryptionService.aesEncrypt(secret, "anotherKey");
    const encryptedData4 = await encryptionService.aesEncrypt("anotherSecret", key);

    expect(encryptedData1).not.toBeNull();
    expect(encryptedData2).not.toBeNull();
    expect(encryptedData3).not.toBeNull();
    expect(encryptedData4).not.toBeNull();

    const encryptedData1Json = JSON.parse(encryptedData1);
    expect(encryptedData1Json.salt).not.toBeNull();
    expect(encryptedData1Json.iv).not.toBeNull();
    expect(encryptedData1Json.cypherText).not.toBeNull();

    const encryptedData2Json = JSON.parse(encryptedData2);
    expect(encryptedData2Json.salt).not.toBe(encryptedData1Json.salt);
    expect(encryptedData2Json.iv).not.toBe(encryptedData1Json.iv);
    expect(encryptedData2Json.cypherText).not.toBe(encryptedData1Json.cypherText);

    expect(encryptedData1).not.toEqual(encryptedData2);
    expect(encryptedData1).not.toEqual(encryptedData3);
    expect(encryptedData1).not.toEqual(encryptedData4);

    const decryptedData1 = await encryptionService.aesDecrypt(encryptedData1, key);
    const decryptedData2 = await encryptionService.aesDecrypt(encryptedData2, key);
    const decryptedData3 = await encryptionService.aesDecrypt(encryptedData3, "anotherKey");
    const decryptedData4 = await encryptionService.aesDecrypt(encryptedData4, key);
    expect(decryptedData1).toEqual(secret);
    expect(decryptedData2).toEqual(secret);
    expect(decryptedData3).toEqual(secret);
    expect(decryptedData4).toEqual("anotherSecret");
  });

  test(`importSymmetricKey`, async () => {
    const secret = "secret".repeat(100);
    const symmetricKey = await encryptionService.generateSymmetricKey();
    const importedKey = await encryptionService.importSymmetricKey(symmetricKey);

    expect(importedKey.extractable).toBeFalsy();

    const encryptedData = await encryptionService.aesEncrypt(secret, importedKey);

    const encryptedDataJson = JSON.parse(encryptedData);
    expect(encryptedDataJson.salt).toBeNull();

    const decryptedData = await encryptionService.aesDecrypt(encryptedData, importedKey);
    expect(decryptedData).toEqual(secret);
  });

  test(`RSA - Keys generation`, async () => {
    const keyPair = await encryptionService.generateRsaKeys();
    expect(keyPair.publicKey).not.toBeNull();
    expect(keyPair.privateKey).not.toBeNull();
  });

  test(`RSA - Encrypt & Decrypt AES keys`, async () => {
    const aesKey = "77e63bc7d0d5c5b9cc804edc76658f53f603eb670fb484ef59129e7378776e36";

    const keyPair = await encryptionService.generateRsaKeys();
    const encryptedData = await encryptionService.rsaEncrypt(aesKey, keyPair.publicKey);

    expect(encryptedData).not.toBeNull();

    const decryptedData = await encryptionService.rsaDecrypt(encryptedData, keyPair.privateKey);
    expect(decryptedData).toBe(aesKey);
  });

  test(`RSA - Encrypt & Decrypt - maximum dataToEncrypt length`, async () => {
    const dataTooLong = "x".repeat(383);
    await expect(encryptionService.rsaEncrypt(dataTooLong, "")).rejects.toEqual(new Error("dataToEncrypt is too long"));

    const dataNotTooLong = "x".repeat(382);
    const keyPair = await encryptionService.generateRsaKeys();
    const encryptedData = await encryptionService.rsaEncrypt(dataNotTooLong, keyPair.publicKey);

    expect(await encryptionService.rsaDecrypt(encryptedData, keyPair.privateKey)).toBe(dataNotTooLong);
  });

  test(`importRsaKeys`, async () => {
    const aesKey = "77e63bc7d0d5c5b9cc804edc76658f53f603eb670fb484ef59129e7378776e36";

    const keyPair = await encryptionService.generateRsaKeys();
    const rsaKeyPair = await encryptionService.importRsaKeys(keyPair);

    expect(rsaKeyPair.publicKey.extractable).toBeFalsy();
    expect(rsaKeyPair.privateKey.extractable).toBeFalsy();

    const encryptedData = await encryptionService.rsaEncrypt(aesKey, rsaKeyPair.publicKey);
    const decryptedData = await encryptionService.rsaDecrypt(encryptedData, rsaKeyPair.privateKey);
    expect(decryptedData).toBe(aesKey);
  });

  test(`buf2hex and hex2buf`, () => {
    const expectedBuffer = new Uint8Array(256);
    for (let i = 0; i < expectedBuffer.length; i++) {
      expectedBuffer[i] = i;
    }
    const hex = encryptionService.buf2hex(expectedBuffer);
    const buffer = encryptionService.hex2buf(hex);

    expect(buffer).toEqual(expectedBuffer);
  });
});
