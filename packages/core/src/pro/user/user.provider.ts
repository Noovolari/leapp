import { SignupRequestDto } from "./dto/signup-request-dto";
import { EncryptionProvider } from "../encryption/encryption.provider";
import { User } from "./user";
import { SigninResponseDto } from "./dto/signin-response-dto";
import { UserActivationRequestDto } from "./dto/user-activation-request-dto";
import { SigninRequestDto } from "./dto/signin-request-dto";
import { HttpClientInterface } from "../http/HttpClientInterface";

export class UserProvider {
  constructor(
    private readonly apiEndpoint: string,
    private readonly httpClient: HttpClientInterface,
    private readonly encryptionProvider: EncryptionProvider
  ) {}

  async signUp(firstName: string, lastName: string, email: string, password: string): Promise<void> {
    const masterKey = await this.encryptionProvider.hash(password, email);
    const clientMasterHash = await this.encryptionProvider.hash(masterKey, password);
    const symmetricKey = await this.encryptionProvider.generateSymmetricKey();
    const protectedSymmetricKey = await this.encryptionProvider.aesEncrypt(symmetricKey, masterKey);
    const rsaKeys = await this.encryptionProvider.generateRsaKeys();
    const protectedPrivateRSAKey = await this.encryptionProvider.aesEncrypt(rsaKeys.privateKey, symmetricKey);
    const requestDto = new SignupRequestDto(
      firstName,
      lastName,
      email,
      clientMasterHash,
      protectedSymmetricKey,
      rsaKeys.publicKey,
      protectedPrivateRSAKey
    );

    await this.httpClient.post(`${this.apiEndpoint}/user`, requestDto);
  }

  async signIn(email: string, password: string): Promise<User> {
    const masterKey = await this.encryptionProvider.hash(password, email);
    const clientMasterHash = await this.encryptionProvider.hash(masterKey, password);
    const requestDto = new SigninRequestDto(email, clientMasterHash);
    const requestUrl = `${this.apiEndpoint}/user/signin`;
    const responseDto = await this.httpClient.post<SigninResponseDto>(requestUrl, requestDto);

    const symmetricKey = await this.encryptionProvider.aesDecrypt(responseDto.protectedSymmetricKey, masterKey);
    const privateRsaKey = await this.encryptionProvider.aesDecrypt(responseDto.rsaProtectedPrivateKey, symmetricKey);
    return new User(
      responseDto.userId,
      responseDto.firstName,
      responseDto.lastName,
      responseDto.email,
      symmetricKey,
      privateRsaKey,
      responseDto.rsaPublicKey,
      responseDto.permissions,
      responseDto.accessToken
    );
  }

  async activateAccount(userId: string, activationCode: string): Promise<void> {
    const requestUrl = `${this.apiEndpoint}/user/activation`;
    const requestDto = new UserActivationRequestDto(userId, activationCode);
    await this.httpClient.put<void>(requestUrl, requestDto);
  }
}
