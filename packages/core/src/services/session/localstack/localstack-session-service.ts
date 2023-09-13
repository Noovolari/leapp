import { LeappBaseError } from "../../../errors/leapp-base-error";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { CredentialsInfo } from "../../../models/credentials-info";
import { SessionStatus } from "../../../models/session-status";
import { SessionType } from "../../../models/session-type";
import { LogLevel } from "../../log-service";
import { Repository } from "../../repository";
import { SessionService } from "../session-service";
import { constants } from "../../../models/constants";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { LocalstackSession } from "../../../models/localstack/localstack-session";
import { LocalstackSessionRequest } from "./localstack-session-request";
import { Session } from "../../../models/session";
import { AwsProcessCredentials } from "../../../models/aws/aws-process-credential";

export class LocalstackSessionService extends SessionService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  constructor(
    protected sessionNotifier: IBehaviouralNotifier,
    protected repository: Repository,
    protected awsCoreService: AwsCoreService,
    protected fileService: FileService
  ) {
    super(sessionNotifier, repository);
  }

  async create(request: LocalstackSessionRequest): Promise<void> {
    const session = new LocalstackSession(request.sessionName, request.region, request.profileId);
    if (request.sessionId) {
      session.sessionId = request.sessionId;
    }
    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
  }

  async update(sessionId: string, updateRequest: LocalstackSessionRequest): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as LocalstackSession;
    if (session) {
      session.sessionName = updateRequest.sessionName;
      session.region = updateRequest.region;
      session.profileId = updateRequest.profileId;

      this.repository.updateSession(sessionId, session);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
    }
  }

  async start(sessionId: string): Promise<void> {
    try {
      if (this.isThereAnotherPendingSessionWithSameNamedProfile(sessionId)) {
        throw new LeappBaseError("Pending session with same named profile", this, LogLevel.info, "Pending session with same named profile");
      }
      await this.stopAllWithSameNameProfile(sessionId);
      this.sessionLoading(sessionId);
      if (this.repository.getWorkspace().credentialMethod === constants.credentialFile) {
        const credentialsInfo = await this.generateCredentials();
        await this.applyCredentials(sessionId, credentialsInfo);
      } else {
        await this.generateProcessCredentials(undefined);
      }
      this.sessionActivated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async rotate(sessionId: string): Promise<void> {
    console.log(`localstack session ${sessionId} opened not need to refresh`);
  }

  async stop(sessionId: string): Promise<void> {
    if (this.isInactive(sessionId)) {
      return;
    }
    try {
      if (this.repository.getWorkspace().credentialMethod === constants.credentialFile) {
        await this.deApplyCredentials(sessionId);
      } else {
        await this.deApplyConfigProfileCommand(sessionId);
      }
      this.sessionDeactivated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      if (this.repository.getSessionById(sessionId).status === SessionStatus.active) {
        await this.stop(sessionId);
      }
      this.repository.deleteSession(sessionId);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async deApplyConfigProfileCommand(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as any).profileId);
    const profile = `profile ${profileName}`;
    const credentialProcess = await this.fileService.iniParseSync(this.awsCoreService.awsConfigPath());
    delete credentialProcess[profile];
    await this.fileService.replaceWriteSync(this.awsCoreService.awsConfigPath(), credentialProcess);
  }

  generateCredentials = (): Promise<CredentialsInfo> => {
    const credentials: CredentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "test",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "test",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        endpoint_url: "http://localhost:4566",
      },
    };
    return Promise.resolve(credentials);
  };

  applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): any {
    const session = this.repository.getSessionById(sessionId);
    if (session.type === SessionType.localstack) {
      const localStackSession: LocalstackSession = session as LocalstackSession;
      const profileName = this.repository.getProfileName(localStackSession.profileId);
      const credentialObject = {};
      credentialObject[profileName] = {
        // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/naming-convention
        aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        endpoint_url: credentialsInfo.sessionToken.endpoint_url,
        region: session.region,
      };
      return this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
    }
  }

  async generateProcessCredentials(_: string): Promise<AwsProcessCredentials> {
    throw new Error("Localstack only support Credential file method, please switch back to it in the option panel.");
  }

  async deApplyCredentials(sessionId: string): Promise<any> {
    const session = this.repository.getSessions().find((sess) => sess.sessionId === sessionId);
    if (session.type === SessionType.localstack) {
      const localStackSession: LocalstackSession = session as LocalstackSession;
      const profileName = this.repository.getProfileName(localStackSession.profileId);
      const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
      delete credentialsFile[profileName];
      return await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
    }
  }

  // eslint-disable-next-line no-unused-vars
  getCloneRequest(session: Session): Promise<LocalstackSessionRequest> {
    return Promise.resolve(undefined);
  }

  // eslint-disable-next-line no-unused-vars
  getDependantSessions(sessionId: string): Session[] {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  validateCredentials(sessionId: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  private isThereAnotherPendingSessionWithSameNamedProfile(sessionId: string): boolean {
    const session = this.repository.getSessionById(sessionId);
    const profileId = (session as any).profileId;
    const pendingSessions = this.repository.listPending();

    for (let i = 0; i < pendingSessions.length; i++) {
      if ((pendingSessions[i] as any).profileId === profileId && (pendingSessions[i] as any).sessionId !== sessionId) {
        return true;
      }
    }

    return false;
  }

  private async stopAllWithSameNameProfile(sessionId: string): Promise<void> {
    // Get profile to check
    const session = this.repository.getSessionById(sessionId);
    const profileId = (session as any).profileId;
    // Get all active sessions
    const activeSessions = this.repository.listActive();
    // Stop all that shares the same profile
    for (let i = 0; i < activeSessions.length; i++) {
      const sess = activeSessions[i];
      if ((sess as any).profileId === profileId) {
        await this.stop(sess.sessionId);
      }
    }
  }
}
