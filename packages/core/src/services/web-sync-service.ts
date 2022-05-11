import { SessionFactory } from "./session-factory";
import { CreateSessionDto } from "../models/web-dto/create-session-dto";
import { SessionType } from "../models/session-type";
import { CreateSessionRequest } from "./session/create-session-request";
import { NamedProfilesService } from "./named-profiles-service";
import { IamUserSessionFieldsDto } from "../models/web-dto/iam-user-session-fields-dto";
import { Repository } from "./repository";
import { LoggedException, LogLevel } from "./log-service";

export class WebSyncService {
  constructor(
    private readonly sessionFactory: SessionFactory,
    private readonly namedProfilesService: NamedProfilesService,
    private readonly repository: Repository
  ) {}

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

  async createSession(createSessionDto: CreateSessionDto): Promise<void> {
    const sessionService = await this.sessionFactory.getSessionService(createSessionDto.sessionType);
    if (this.repository.getSessionById(createSessionDto.sessionFields.sessionId)) {
      throw new LoggedException(`Session "${createSessionDto.sessionFields.sessionName}" already exists`, this, LogLevel.error, true);
    }
    await sessionService.create(await this.getSessionRequest(createSessionDto));
  }
}
