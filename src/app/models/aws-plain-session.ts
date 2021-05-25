import {SessionType} from './session-type';
import {Session} from './session';

export class AwsPlainSession extends Session {
  region: string;
  mfaDevice?: string;
  sessionTokenExpiration: string;
  profileId: string;

  constructor(sessionName: string, region: string, profileId: string, mfaDevice?: string) {
    super(sessionName, region);

    this.mfaDevice = mfaDevice;
    this.type = SessionType.awsPlain;
    this.profileId = profileId;
  }
}

