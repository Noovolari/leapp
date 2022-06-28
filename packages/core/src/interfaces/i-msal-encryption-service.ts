export interface IMsalEncryptionService {
  protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array, scope: string): Uint8Array;
  unprotectData(encryptData: Uint8Array, optionalEntropy: Uint8Array, scope: string): Uint8Array;
}
