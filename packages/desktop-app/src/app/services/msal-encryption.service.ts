import { IMsalEncryptionService } from "@noovolari/leapp-core/interfaces/i-msal-encryption-service";

// Convert the native sync service to an async service
export class MsalEncryptionService implements IMsalEncryptionService {
  constructor(private nativeMsalEncryptionService: any) {}

  async protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array, scope: string): Promise<Uint8Array> {
    return this.nativeMsalEncryptionService.protectData(dataToEncrypt, optionalEntropy, scope);
  }

  async unprotectData(encryptedData: Uint8Array, optionalEntropy: Uint8Array, scope: string): Promise<Uint8Array> {
    return this.nativeMsalEncryptionService.unprotectData(encryptedData, optionalEntropy, scope);
  }
}
