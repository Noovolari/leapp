import { EncryptionProvider } from "leapp-team-core/encryption/encryption.provider";

describe("EncryptionProvider with web crypto API", () => {
  let encryptionProvider: EncryptionProvider;

  beforeEach(() => {
    encryptionProvider = new EncryptionProvider(window.crypto);
  });

  it(`Hash`, async () => {
    const secret = "secret";
    const salt = "salt";

    const hash1 = await encryptionProvider.hash(secret, salt);
    const hash2 = await encryptionProvider.hash(secret, salt);
    const hash3 = await encryptionProvider.hash("different secret", salt);
    const hash4 = await encryptionProvider.hash(secret, "different hash");

    expect(hash1).toBe("3745e482c6e0ade35da10139e797157f4a5da669dad7d5da88ef87e47471cc47");
    expect(hash1).toEqual(hash2);
    expect(hash1).not.toEqual(hash3);
    expect(hash1).not.toEqual(hash4);
  });

  it(`GenerateSymmetricKey`, async () => {
    const key1 = await encryptionProvider.generateSymmetricKey();
    const key2 = await encryptionProvider.generateSymmetricKey();

    expect(key1).not.toBeNull();
    expect(key1.length).toBe(64);
    expect(key2).not.toBeNull();
    expect(key2.length).toBe(64);
    expect(key1).not.toEqual(key2);
  });

  it(`AES - Encrypt & Decrypt with key derivation`, async () => {
    const secret = "secret".repeat(100);
    const key = "AES key";

    const encryptedData1 = await encryptionProvider.aesEncrypt(secret, key);
    const encryptedData2 = await encryptionProvider.aesEncrypt(secret, key);
    const encryptedData3 = await encryptionProvider.aesEncrypt(secret, "anotherKey");
    const encryptedData4 = await encryptionProvider.aesEncrypt("anotherSecret", key);

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

    const decryptedData1 = await encryptionProvider.aesDecrypt(encryptedData1, key);
    const decryptedData2 = await encryptionProvider.aesDecrypt(encryptedData2, key);
    const decryptedData3 = await encryptionProvider.aesDecrypt(encryptedData3, "anotherKey");
    const decryptedData4 = await encryptionProvider.aesDecrypt(encryptedData4, key);
    expect(decryptedData1).toEqual(secret);
    expect(decryptedData2).toEqual(secret);
    expect(decryptedData3).toEqual(secret);
    expect(decryptedData4).toEqual("anotherSecret");
  });

  it(`importSymmetricKey`, async () => {
    const secret = "secret".repeat(100);
    const symmetricKey = await encryptionProvider.generateSymmetricKey();
    const importedKey = await encryptionProvider.importSymmetricKey(symmetricKey);

    expect(importedKey.extractable).toBeFalse();

    const encryptedData = await encryptionProvider.aesEncrypt(secret, importedKey);

    const encryptedDataJson = JSON.parse(encryptedData);
    expect(encryptedDataJson.salt).toBeNull();

    const decryptedData = await encryptionProvider.aesDecrypt(encryptedData, importedKey);
    expect(decryptedData).toEqual(secret);
  });

  it(`RSA - Keys generation`, async () => {
    const keyPair = await encryptionProvider.generateRsaKeys();
    expect(keyPair.publicKey).not.toBeNull();
    expect(keyPair.privateKey).not.toBeNull();
  });

  it(`RSA - Encrypt & Decrypt AES keys`, async () => {
    const aesKey = "77e63bc7d0d5c5b9cc804edc76658f53f603eb670fb484ef59129e7378776e36";

    const keyPair = await encryptionProvider.generateRsaKeys();
    const encryptedData = await encryptionProvider.rsaEncrypt(aesKey, keyPair.publicKey);

    expect(encryptedData).not.toBeNull();

    const decryptedData = await encryptionProvider.rsaDecrypt(encryptedData, keyPair.privateKey);
    expect(decryptedData).toBe(aesKey);
  });

  it(`RSA - Encrypt & Decrypt - maximum dataToEncrypt length`, async () => {
    const dataTooLong = "x".repeat(383);
    await expectAsync(encryptionProvider.rsaEncrypt(dataTooLong, "")).toBeRejectedWith(new Error("dataToEncrypt is too long"));

    const dataNotTooLong = "x".repeat(382);
    const keyPair = await encryptionProvider.generateRsaKeys();
    const encryptedData = await encryptionProvider.rsaEncrypt(dataNotTooLong, keyPair.publicKey);

    expect(await encryptionProvider.rsaDecrypt(encryptedData, keyPair.privateKey)).toBe(dataNotTooLong);
  });

  it(`importRsaKeys`, async () => {
    const aesKey = "77e63bc7d0d5c5b9cc804edc76658f53f603eb670fb484ef59129e7378776e36";

    const keyPair = await encryptionProvider.generateRsaKeys();
    const rsaKeyPair = await encryptionProvider.importRsaKeys(keyPair);

    expect(rsaKeyPair.publicKey?.extractable).toBeFalse();
    expect(rsaKeyPair.privateKey?.extractable).toBeFalse();

    const encryptedData = await encryptionProvider.rsaEncrypt(aesKey, rsaKeyPair.publicKey as any);
    const decryptedData = await encryptionProvider.rsaDecrypt(encryptedData, rsaKeyPair.privateKey as any);
    expect(decryptedData).toBe(aesKey);
  });

  it(`buf2hex and hex2buf`, () => {
    const expectedBuffer = new Uint8Array([...Array(256).keys()]);
    const hex = encryptionProvider.buf2hex(expectedBuffer);
    const buffer = encryptionProvider.hex2buf(hex);

    expect(buffer).toEqual(expectedBuffer);
  });
});
