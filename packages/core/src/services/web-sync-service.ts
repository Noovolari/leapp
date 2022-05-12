import * as crypto from "crypto";
import axios, { AxiosRequestConfig } from "axios";
import { SessionFactory } from "./session-factory";
import { CreateSessionDto } from "../models/web-dto/create-session-dto";
import { SessionType } from "../models/session-type";
import { CreateSessionRequest } from "./session/create-session-request";
import { NamedProfilesService } from "./named-profiles-service";
import { IamUserSessionFieldsDto } from "../models/web-dto/iam-user-session-fields-dto";
import { SessionManagementService } from "./session-management-service";
import { EncryptionProvider } from "../pro/encryption/encryption.provider";
import { SessionProvider } from "../pro/session/session-provider";
import { UserProvider } from "../pro/user/user.provider";
import { HttpClientInterface } from "../pro/http/HttpClientInterface";
import { User } from "../pro/user/user";

export class WebSyncService {
  private readonly encryptionProvider: EncryptionProvider;
  private readonly sessionProvider: SessionProvider;
  private readonly userProvider: UserProvider;
  private currentUser: User;

  constructor(
    private readonly sessionFactory: SessionFactory,
    private readonly namedProfilesService: NamedProfilesService,
    private readonly sessionManagementService: SessionManagementService
  ) {
    const apiEndpoint = "http://localhost:3000";
    const httpClient: HttpClientInterface = {
      get: async <T>(url: string): Promise<T> => (await axios.get<T>(url, this.getHttpClientConfig())).data,
      post: async <T>(url: string, body: any): Promise<T> => (await axios.post<T>(url, body, this.getHttpClientConfig())).data,
      put: async <T>(url: string, body: any): Promise<T> => (await axios.put<T>(url, body, this.getHttpClientConfig())).data,
    };
    this.encryptionProvider = new EncryptionProvider((crypto as any).webcrypto);
    this.sessionProvider = new SessionProvider(apiEndpoint, httpClient, this.encryptionProvider);
    this.userProvider = new UserProvider(apiEndpoint, httpClient, this.encryptionProvider);
  }

  async syncSessions(email: string, password: string): Promise<CreateSessionDto[]> {
    this.currentUser = await this.userProvider.signIn(email, password);
    const rsaKeys = await this.getRSAKeys(this.currentUser);
    const createSessionDtos = await this.sessionProvider.getSessions(rsaKeys.privateKey);
    for (const createSessionDto of createSessionDtos) {
      await this.syncSession(createSessionDto);
    }
    return createSessionDtos;
  }

  async syncSession(createSessionDto: CreateSessionDto): Promise<void> {
    const sessionService = await this.sessionFactory.getSessionService(createSessionDto.sessionType);
    if (this.sessionManagementService.getSessionById(createSessionDto.sessionFields.sessionId)) {
      // TODO: In case the session already exists, the current local named profile should be kept and other session data updated
      await sessionService.delete(createSessionDto.sessionFields.sessionId);
    }
    await sessionService.create(await this.getSessionRequest(createSessionDto));
  }

  async getRSAKeys(user: User): Promise<CryptoKeyPair> {
    const rsaKeyJsonPair = { privateKey: user.privateRSAKey, publicKey: user.publicRSAKey };
    return await this.encryptionProvider.importRsaKeys(rsaKeyJsonPair);
  }

  async getSessionRequest(createSessionDto: CreateSessionDto): Promise<CreateSessionRequest> {
    if (createSessionDto.sessionType === SessionType.awsIamUser) {
      const sessionFields = createSessionDto.sessionFields as IamUserSessionFieldsDto;
      const mergedProfile = this.namedProfilesService.mergeProfileName(sessionFields.profileName);
      return {
        sessionName: sessionFields.sessionName,
        accessKey: sessionFields.accessKey,
        secretKey: sessionFields.secretKey,
        region: sessionFields.region,
        mfaDevice: sessionFields.mfaDevice,
        profileId: mergedProfile.id,
      } as CreateSessionRequest;
    }
  }

  getHttpClientConfig(): AxiosRequestConfig {
    return this.currentUser
      ? {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Authorization: `Bearer ${this.currentUser.accessToken}` },
        }
      : {};
  }
}
