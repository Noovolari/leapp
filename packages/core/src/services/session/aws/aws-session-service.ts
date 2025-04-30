import { LeappBaseError } from "../../../errors/leapp-base-error";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AwsProcessCredentials } from "../../../models/aws/aws-process-credential";
import { CredentialsInfo } from "../../../models/credentials-info";
import { Session } from "../../../models/session";
import { SessionStatus } from "../../../models/session-status";
import { SessionType } from "../../../models/session-type";
import { LogLevel } from "../../log-service";
import { Repository } from "../../repository";
import { SessionService } from "../session-service";
import { constants } from "../../../models/constants";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";

export abstract class AwsSessionService extends SessionService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  protected constructor(
    protected sessionNotifier: IBehaviouralNotifier,
    protected repository: Repository,
    protected awsCoreService: AwsCoreService,
    protected fileService: FileService
  ) {
    super(sessionNotifier, repository);
  }

  getDependantSessions(sessionId: string): Session[] {
    return this.repository.listIamRoleChained(this.repository.getSessionById(sessionId));
  }

  async start(sessionId: string): Promise<void> {
    try {
      if (this.isThereAnotherPendingSessionWithSameNamedProfile(sessionId)) {
        throw new LeappBaseError("Pending session with same named profile", this, LogLevel.info, "Pending session with same named profile");
      }
      await this.stopAllWithSameNameProfile(sessionId);
      this.sessionLoading(sessionId);
      if (this.repository.getWorkspace().credentialMethod === constants.credentialFile) {
        const credentialsInfo = await this.generateCredentials(sessionId);
        await this.applyCredentials(sessionId, credentialsInfo);
      } else {
        await this.applyConfigProfileCommand(sessionId);
      }
      this.sessionActivated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async rotate(sessionId: string): Promise<void> {
    try {
      // We don't need to rotate credentials when in  credential process mode
      if (this.repository.getWorkspace().credentialMethod === constants.credentialFile) {
        this.sessionLoading(sessionId);
        const credentialsInfo = await this.generateCredentials(sessionId);
        await this.applyCredentials(sessionId, credentialsInfo);
        this.sessionActivated(sessionId);
      }
    } catch (error) {
      this.sessionError(sessionId, error);
    }
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
      for (const sess of this.getDependantSessions(sessionId)) {
        if (sess.status === SessionStatus.active) {
          await this.stop(sess.sessionId);
        }
        this.repository.deleteSession(sess.sessionId);
      }
      this.repository.deleteSession(sessionId);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
      await this.removeSecrets(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async generateProcessCredentials(sessionId: string): Promise<AwsProcessCredentials> {
    const session = this.repository.getSessionById(sessionId);
    if (session.type !== SessionType.azure) {
      const credentials = await this.generateCredentialsProxy(sessionId);
      const token = credentials.sessionToken;
      return new AwsProcessCredentials(
        1,
        token.aws_access_key_id,
        token.aws_secret_access_key,
        token.aws_session_token,
        session.sessionTokenExpiration
      );
    } else {
      throw new Error("only AWS sessions are supported");
    }
  }

  async applyConfigProfileCommand(sessionId: string): Promise<void> {
    try {
      const session = this.repository.getSessionById(sessionId) as any;
      const command = `leapp session generate ${sessionId}`;
      const profileName = this.repository.getProfileName(session.profileId);
      const profile = `profile ${profileName}`;
      const credentialProcess: { [key: string]: any } = {};
      credentialProcess[profile] = {
        ["credential_process"]: command,
        region: session.region,
      };

      await this.fileService.iniWriteSync(this.awsCoreService.awsConfigPath(), credentialProcess);
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

  private isThereAnotherPendingSessionWithSameNamedProfile(sessionId: string) {
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

  generateCredentialsProxy(sessionId: string): Promise<CredentialsInfo> {
    return this.generateCredentials(sessionId);
  }

  abstract getAccountNumberFromCallerIdentity(session: Session): Promise<string>;

  abstract generateCredentials(sessionId: string): Promise<CredentialsInfo>;

  abstract applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void>;

  abstract deApplyCredentials(sessionId: string): Promise<void>;

  abstract removeSecrets(sessionId: string): void;
}
