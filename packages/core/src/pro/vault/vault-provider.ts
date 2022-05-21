import { HttpClientInterface } from "../http/HttpClientInterface";
import { EncryptionProvider } from "../encryption/encryption.provider";
import { GetSecretsResponseDto } from "./dto/get-secrets-response-dto";
import { SetSecretsRequestDto } from "./dto/set-secrets-request-dto";
import { CreateSecretDto } from "./dto/create-secret-dto";
import { FollowRedirectResponseDto } from "./dto/follow-redirect-response-dto";
import { LocalSecretDto } from "../../models/web-dto/local-secret-dto";

export class VaultProvider {
  constructor(
    private readonly apiEndpoint: string,
    private readonly httpClient: HttpClientInterface,
    private readonly encryptionProvider: EncryptionProvider
  ) {}

  async getSecrets(privateRSAKey: CryptoKey): Promise<LocalSecretDto[]> {
    const responseDto = await this.httpClient.get<GetSecretsResponseDto>(`${this.apiEndpoint}/vault/secret`);
    const localSecretPromises = responseDto.secrets.map(async (encryptedLocalSecret) => {
      const sharedSymmetricKeyString = await this.encryptionProvider.rsaDecrypt(encryptedLocalSecret.protectedSecretKey, privateRSAKey);
      const sharedSymmetricKey = await this.encryptionProvider.importSymmetricKey(sharedSymmetricKeyString);
      const serializedSecret = await this.encryptionProvider.aesDecrypt(encryptedLocalSecret.encryptedSecret, sharedSymmetricKey);
      return JSON.parse(serializedSecret);
    });
    return await Promise.all(localSecretPromises);
  }

  async setSecrets(publicRSAKey: CryptoKey, localSecrets: LocalSecretDto[]): Promise<void> {
    const serializedSecretsPromises = localSecrets.map(async (localSecret) => {
      const sharedSymmetricKeyString = await this.encryptionProvider.generateSymmetricKey();
      const sharedSymmetricKey = await this.encryptionProvider.importSymmetricKey(sharedSymmetricKeyString);
      const serializedSecret = JSON.stringify(localSecret);
      const encryptedSecret = await this.encryptionProvider.aesEncrypt(serializedSecret, sharedSymmetricKey);
      const protectedSharedSymmetricKey = await this.encryptionProvider.rsaEncrypt(sharedSymmetricKeyString, publicRSAKey);
      return new CreateSecretDto(protectedSharedSymmetricKey, encryptedSecret);
    });
    const serializedSecrets = await Promise.all(serializedSecretsPromises);
    await this.httpClient.put(`${this.apiEndpoint}/vault/secret`, new SetSecretsRequestDto(serializedSecrets));
  }

  async followRedirects(url: string): Promise<FollowRedirectResponseDto> {
    return await this.httpClient.get<FollowRedirectResponseDto>(`${this.apiEndpoint}/vault/finalPortalUrl?url=${encodeURIComponent(url)}`);
  }
}
