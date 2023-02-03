import { Injectable } from "@angular/core";
import { User } from "leapp-team-core/user/user";
import { EncryptionProvider } from "leapp-team-core/encryption/encryption.provider";
import { VaultProvider } from "leapp-team-core/vault/vault-provider";
import { ConfigurationService } from "../configuration/configuration.service";
import { LocalStorageService } from "../storage/local-storage.service";
import { HttpClientService } from "../http/http-client.service";
import { LocalSecretDto } from "leapp-team-core/encryptable-dto/local-secret-dto";
import { BehaviorSubject } from "rxjs";
import * as uuid from "uuid";
import { AwsIamRoleChainedLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-role-chained-local-session-dto";
import { SnackbarErrorService } from "../errors/snackbar-error.service";
import { VaultSharedUser } from "leapp-team-core/vault/vault-shared-user";
import { SecretType } from "leapp-team-core/encryptable-dto/secret-type";

@Injectable({ providedIn: "root" })
export class VaultService {
  public encryptionProvider: EncryptionProvider;
  public vaultProvider: VaultProvider;
  public fetchingState: BehaviorSubject<boolean>;

  private _secretsState?: BehaviorSubject<LocalSecretDto[]>;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigurationService,
    private readonly localStorageService: LocalStorageService,
    private readonly snackbarErrorService: SnackbarErrorService
  ) {
    this.encryptionProvider = new EncryptionProvider(window.crypto);
    this.vaultProvider = new VaultProvider(configService.apiEndpoint, httpClientService, new EncryptionProvider(window.crypto));
    this.fetchingState = new BehaviorSubject<boolean>(false);
  }

  public get secretsState(): BehaviorSubject<LocalSecretDto[]> {
    if (!this._secretsState) {
      this._secretsState = new BehaviorSubject<LocalSecretDto[]>([]);
      this.refreshSecrets();
    }
    return this._secretsState;
  }

  refreshSecrets(): void {
    this.fetchingState.next(true);
    this.getSecrets()
      .then((secrets) => {
        if (this._secretsState) {
          this._secretsState.next(secrets);
        }
      })
      .catch((error) => {
        if (this._secretsState) {
          this._secretsState.next(error);
        }
      })
      .finally(() => {
        this.fetchingState.next(false);
      });
  }

  async addAwsIamRoleChainedSession(
    sessionName: string,
    region: string,
    roleArn: string,
    roleSessionName: string | undefined,
    assumerSessionId: string | undefined,
    assumerRoleName: string | undefined,
    assumerIntegrationId: string | undefined,
    assumerAccountId: string | undefined,
    profileName: string
  ): Promise<void> {
    const awsIamRoleChainedLocalSessionDto = new AwsIamRoleChainedLocalSessionDto(
      uuid.v4(),
      sessionName,
      region,
      roleArn,
      roleSessionName,
      assumerSessionId,
      assumerRoleName,
      assumerIntegrationId,
      assumerAccountId,
      profileName
    );

    const userId = (this.localStorageService.getItem("user") as User).userId;
    await this.createSecret(userId, awsIamRoleChainedLocalSessionDto);
  }

  async getSecrets(): Promise<LocalSecretDto[]> {
    let privateRsaKey: CryptoKey | undefined;
    try {
      privateRsaKey = (await this.getRSAKeys()).privateKey;
    } catch (error) {
      this.snackbarErrorService.showMessage("Invalid user RSA Keys");
    }
    const secrets = await this.vaultProvider.getSecrets(
      privateRsaKey || {
        algorithm: { name: "" },
        extractable: true,
        type: "private",
        usages: ["decrypt"],
      }
    );
    this.secretsState.next(secrets);
    return secrets;
  }

  async createSecret(userId: string, secret: LocalSecretDto): Promise<void> {
    let publicRsaKey: CryptoKey | undefined;
    try {
      publicRsaKey = (await this.getRSAKeys()).publicKey;
      if (!publicRsaKey) {
        this.snackbarErrorService.showMessage("User public RSA key not found");
        return;
      }
    } catch (error) {
      this.snackbarErrorService.showMessage("Invalid user RSA Keys");
      return;
    }
    const createResponse = await this.vaultProvider.createSecret(userId, publicRsaKey, secret);
    secret.secretId = createResponse.secretId;

    this.secretsState.next([...this.secretsState.value, secret]);
  }

  async updateSecret(vaultSharedUsers: VaultSharedUser[], secret: LocalSecretDto): Promise<void> {
    let publicRsaKey: CryptoKey | undefined;
    try {
      publicRsaKey = (await this.getRSAKeys()).publicKey;
      if (!publicRsaKey) {
        this.snackbarErrorService.showMessage("User public RSA key not found");
        return;
      }
    } catch (error) {
      this.snackbarErrorService.showMessage("Invalid user RSA Keys");
      return;
    }

    await this.vaultProvider.updateSecret(vaultSharedUsers, secret);
    let newSecretState;
    const found = this.secretsState.value.find((s) => s.secretId === secret.secretId);
    if (found) {
      newSecretState = this.secretsState.value.map((s) => (s.secretId !== secret.secretId ? s : secret));
    } else {
      newSecretState = [...this.secretsState.value, secret];
    }

    this.secretsState.next(newSecretState);
  }

  async deleteSecret(secretId: string, secretType: SecretType): Promise<void> {
    await this.vaultProvider.deleteSecret(new LocalSecretDto(secretType, secretId));
  }

  private async getRSAKeys(): Promise<CryptoKeyPair> {
    const user = this.localStorageService.getItem<User>("user") || { privateRSAKey: "", publicRSAKey: "" };
    const rsaKeyJsonPair = { privateKey: user.privateRSAKey, publicKey: user.publicRSAKey };
    return await this.encryptionProvider.importRsaKeys(rsaKeyJsonPair);
  }
}
