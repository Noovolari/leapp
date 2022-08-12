export interface IMsalEncryptionService {
  protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array, scope: string): Promise<Uint8Array>;
  unprotectData(encryptedData: Uint8Array, optionalEntropy: Uint8Array, scope: string): Promise<Uint8Array>;
}
