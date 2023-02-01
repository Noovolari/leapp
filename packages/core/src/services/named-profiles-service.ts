import * as uuid from "uuid";
import { constants } from "../models/constants";
import { AwsNamedProfile } from "../models/aws/aws-named-profile";
import { Repository } from "./repository";
import { Session } from "../models/session";
import { SessionFactory } from "./session-factory";
import { SessionStatus } from "../models/session-status";
import { AwsSessionService } from "./session/aws/aws-session-service";
import { BehaviouralSubjectService } from "./behavioural-subject-service";

export class NamedProfilesService {
  constructor(private sessionFactory: SessionFactory, private repository: Repository, private behaviouralSubjectService: BehaviouralSubjectService) {}

  getNamedProfiles(excludingDefault: boolean = false): AwsNamedProfile[] {
    const excludedProfileId = excludingDefault ? this.repository.getDefaultProfileId() : null;
    return this.repository.getProfiles().filter((profile) => profile.id !== excludedProfileId);
  }

  getProfileName(profileId: string): string {
    return this.repository.getProfileName(profileId);
  }

  getDefaultProfileId(): string {
    return this.repository.getDefaultProfileId();
  }

  getNamedProfilesMap(): Map<string, AwsNamedProfile> {
    return new Map(this.getNamedProfiles().map((profile) => [profile.id, profile] as [string, AwsNamedProfile]));
  }

  /**
   * Get or create the AWS named profile ID from the unique name
   *
   * @param profileName
   * @return id the profile id if the named profile exists, otherwise creates a new profile and returns its id
   */
  getProfileIdByName(profileName: string): string {
    const profileId = this.getNamedProfiles().find((profile) => profile.name === profileName)?.id;
    if (!profileId) {
      return this.createNamedProfile(profileName).id;
    }
    return profileId;
  }

  getSessionsWithNamedProfile(id: string): Session[] {
    return this.repository.getSessions().filter((session) => (session as any).profileId === id);
  }

  createNamedProfile(name: string): AwsNamedProfile {
    const namedProfile = new AwsNamedProfile(this.getNewId(), name.trim());
    this.repository.addProfile(namedProfile);
    return namedProfile;
  }

  mergeProfileName(name: string): AwsNamedProfile {
    const actualNamedProfile = this.repository.getProfiles().find((profile) => profile.name === name);
    if (actualNamedProfile) {
      return actualNamedProfile;
    } else {
      return this.createNamedProfile(name);
    }
  }

  async editNamedProfile(id: string, newName: string): Promise<void> {
    const activeSessions = this.getSessionsWithNamedProfile(id).filter((session) => session.status === SessionStatus.active);

    for (const session of activeSessions) {
      await this.sessionFactory.getSessionService(session.type).stop(session.sessionId);
    }
    this.repository.updateProfile(id, newName.trim());
    for (const session of activeSessions) {
      await this.sessionFactory.getSessionService(session.type).start(session.sessionId);
    }
  }

  async deleteNamedProfile(id: string): Promise<void> {
    const sessions = this.getSessionsWithNamedProfile(id);
    const defaultNamedProfileId = this.repository.getDefaultProfileId();

    for (const session of sessions) {
      const sessionService = this.sessionFactory.getSessionService(session.type);
      const wasActive = session.status === SessionStatus.active;
      if (wasActive) {
        await sessionService.stop(session.sessionId);
      }

      (session as any).profileId = defaultNamedProfileId;
      this.repository.updateSession(session.sessionId, session);
      this.behaviouralSubjectService.setSessions(this.repository.getSessions());

      if (wasActive) {
        await sessionService.start(session.sessionId);
      }
    }
    this.repository.removeProfile(id);
  }

  async changeNamedProfile(session: Session, newNamedProfileId: string): Promise<void> {
    const sessionService = this.sessionFactory.getSessionService(session.type);
    if (sessionService instanceof AwsSessionService) {
      const wasActive = session.status === SessionStatus.active;
      if (wasActive) {
        await sessionService.stop(session.sessionId);
      }

      (session as any).profileId = newNamedProfileId;
      this.repository.updateSession(session.sessionId, session);
      this.behaviouralSubjectService.setSessions(this.repository.getSessions());

      if (wasActive) {
        await sessionService.start(session.sessionId);
      }
    }
  }

  getNewId(): string {
    return uuid.v4();
  }

  validateNewProfileName(name: string): boolean | string {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return "Empty profile name";
    }
    if (trimmedName === constants.defaultAwsProfileName) {
      return '"default" is not a valid profile name';
    }
    const namedProfilesNames = this.getNamedProfiles().map((namedProfile) => namedProfile.name);
    if (namedProfilesNames.includes(trimmedName)) {
      return "Profile already exists";
    }
    return true;
  }
}
