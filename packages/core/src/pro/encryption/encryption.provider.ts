import { RsaKeyPair } from "./rsa-key-pair";

import {
  AES_BLOCK_CYPHER_MODE,
  AES_IV_BYTE_LENGTH,
  AES_KEY_BITS_LENGTH,
  AES_KEY_DERIVATION_SALT_BYTE_LENGTH,
  KEY_DERIVATION_ALGORITHM,
  KEY_DERIVATION_BITS_LENGTH,
  KEY_DERIVATION_HASH_ALGORITHM,
  KEY_DERIVATION_ITERATIONS,
  RSA_PADDING_SCHEME,
  RSA_HASH_ALGORITHM,
  RSA_KEY_BITS_LENGTH,
} from "./encryption-constants";

export class EncryptionProvider {
  private textEncoder: TextEncoder;
  private textDecoder: TextDecoder;

  constructor(private readonly crypto: Crypto) {
    this.textEncoder = new TextEncoder();
    this.textDecoder = new TextDecoder("utf8");
  }

  async hash(secretToHash: string, salt: string): Promise<string> {
    const secretToHashBuffer = this.textEncoder.encode(secretToHash);
    const importedKey = await this.crypto.subtle.importKey("raw", secretToHashBuffer, KEY_DERIVATION_ALGORITHM, false, ["deriveBits"]);
    const saltBuffer = this.textEncoder.encode(salt);
    const params = {
      name: KEY_DERIVATION_ALGORITHM,
      hash: KEY_DERIVATION_HASH_ALGORITHM,
      salt: saltBuffer,
      iterations: KEY_DERIVATION_ITERATIONS,
    };
    const derivation = await this.crypto.subtle.deriveBits(params, importedKey, KEY_DERIVATION_BITS_LENGTH);
    return this.buf2hex(derivation);
  }

  async generateSymmetricKey(): Promise<string> {
    const randomCryptoKey = await this.crypto.subtle.generateKey({ name: AES_BLOCK_CYPHER_MODE, length: AES_KEY_BITS_LENGTH }, true, [
      "encrypt",
      "decrypt",
    ]);
    const randomKey = await this.crypto.subtle.exportKey("raw", randomCryptoKey);
    return this.buf2hex(randomKey);
  }

  async importSymmetricKey(symmetricKey: string): Promise<CryptoKey> {
    return await this.crypto.subtle.importKey("raw", this.hex2buf(symmetricKey), AES_BLOCK_CYPHER_MODE, false, ["encrypt", "decrypt"]);
  }

  async aesEncrypt(dataToEncrypt: string, encryptionKey: string | CryptoKey): Promise<string> {
    let salt: ArrayBuffer | null;
    let key: CryptoKey;
    if (typeof encryptionKey === "string") {
      salt = this.crypto.getRandomValues(new Uint8Array(AES_KEY_DERIVATION_SALT_BYTE_LENGTH));
      key = await this.deriveAesKey(encryptionKey, salt);
    } else {
      salt = null;
      key = encryptionKey;
    }
    const iv = this.crypto.getRandomValues(new Uint8Array(AES_IV_BYTE_LENGTH));
    const ciphertext = await this.crypto.subtle.encrypt({ name: AES_BLOCK_CYPHER_MODE, iv }, key, this.textEncoder.encode(dataToEncrypt));
    return JSON.stringify({
      salt: salt ? this.buf2hex(salt) : null,
      iv: this.buf2hex(iv),
      cypherText: this.buf2hex(ciphertext),
    });
  }

  async aesDecrypt(dataToDecrypt: string, encryptionKey: string | CryptoKey): Promise<string> {
    const data = JSON.parse(dataToDecrypt);
    let key: CryptoKey;
    if (typeof encryptionKey === "string") {
      key = await this.deriveAesKey(encryptionKey, this.hex2buf(data.salt));
    } else {
      key = encryptionKey;
    }
    const iv = this.hex2buf(data.iv);
    const cypherText = this.hex2buf(data.cypherText);
    return this.textDecoder.decode(await this.crypto.subtle.decrypt({ name: AES_BLOCK_CYPHER_MODE, iv }, key, cypherText));
  }

  async deriveAesKey(encryptionKey: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const keyMaterial = await this.crypto.subtle.importKey("raw", this.textEncoder.encode(encryptionKey), { name: KEY_DERIVATION_ALGORITHM }, false, [
      "deriveBits",
      "deriveKey",
    ]);
    return await this.crypto.subtle.deriveKey(
      {
        name: KEY_DERIVATION_ALGORITHM,
        salt,
        iterations: KEY_DERIVATION_ITERATIONS,
        hash: KEY_DERIVATION_HASH_ALGORITHM,
      },
      keyMaterial,
      { name: AES_BLOCK_CYPHER_MODE, length: AES_KEY_BITS_LENGTH },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async generateRsaKeys(): Promise<RsaKeyPair> {
    const rsaKeys = await this.crypto.subtle.generateKey(
      {
        name: RSA_PADDING_SCHEME,
        modulusLength: RSA_KEY_BITS_LENGTH,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: RSA_HASH_ALGORITHM,
      },
      true,
      ["encrypt", "decrypt"]
    );
    const publicKey = await this.crypto.subtle.exportKey("jwk", rsaKeys.publicKey);
    const privateKey = await this.crypto.subtle.exportKey("jwk", rsaKeys.privateKey);
    return {
      publicKey: JSON.stringify(publicKey),
      privateKey: JSON.stringify(privateKey),
    };
  }

  async importRsaKeys(rsaKeyPair: RsaKeyPair): Promise<CryptoKeyPair> {
    const publicJsonWebKey = JSON.parse(rsaKeyPair.publicKey) as JsonWebKey;
    const publicKey = await this.crypto.subtle.importKey(
      "jwk",
      publicJsonWebKey,
      {
        name: RSA_PADDING_SCHEME,
        hash: { name: RSA_HASH_ALGORITHM },
      },
      false,
      ["encrypt"]
    );

    const privateJsonWebKey = JSON.parse(rsaKeyPair.privateKey) as JsonWebKey;
    const privateKey = await this.crypto.subtle.importKey(
      "jwk",
      privateJsonWebKey,
      {
        name: RSA_PADDING_SCHEME,
        hash: { name: RSA_HASH_ALGORITHM },
      },
      false,
      ["decrypt"]
    );

    return { privateKey, publicKey } as CryptoKeyPair;
  }

  async rsaEncrypt(dataToEncrypt: string, publicKey: string | CryptoKey): Promise<string> {
    // Max data to encrypt length: https://www.ietf.org/rfc/rfc3447.txt
    const maximumLength = RSA_KEY_BITS_LENGTH / 8 - (2 * 512) / 8 - 2; // 512 derives from "SHA512" algorithm
    if (dataToEncrypt.length > maximumLength) {
      throw new Error("dataToEncrypt is too long");
    }
    const key =
      typeof publicKey === "string"
        ? await this.crypto.subtle.importKey(
            "jwk",
            JSON.parse(publicKey) as JsonWebKey,
            { name: RSA_PADDING_SCHEME, hash: RSA_HASH_ALGORITHM },
            false,
            ["encrypt"]
          )
        : publicKey;
    const data = this.textEncoder.encode(dataToEncrypt);
    const cipherText = await this.crypto.subtle.encrypt({ name: RSA_PADDING_SCHEME }, key, data);
    return this.buf2hex(cipherText);
  }

  async rsaDecrypt(dataToDecrypt: string, privateKey: string | CryptoKey): Promise<string> {
    const key =
      typeof privateKey === "string"
        ? await this.crypto.subtle.importKey(
            "jwk",
            JSON.parse(privateKey) as JsonWebKey,
            { name: RSA_PADDING_SCHEME, hash: RSA_HASH_ALGORITHM },
            false,
            ["decrypt"]
          )
        : privateKey;
    const decrypted = await this.crypto.subtle.decrypt({ name: RSA_PADDING_SCHEME }, key, this.hex2buf(dataToDecrypt));
    return this.textDecoder.decode(decrypted);
  }

  buf2hex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)].map((x: number) => x.toString(16).padStart(2, "0")).join("");
  }

  hex2buf(hex: string): ArrayBuffer {
    return new Uint8Array((hex.match(/[\da-f]{2}/gi) ?? []).map((h) => parseInt(h, 16)));
  }
}
