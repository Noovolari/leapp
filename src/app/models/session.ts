import {Account} from './account';
import * as uuid from 'uuid';
import {Type} from 'class-transformer';
import {AwsPlainAccount} from './aws-plain-account';
import {SessionType} from './session-type';
import {environment} from '../../environments/environment';
import {SessionStatus} from './session-status';

export class Session {
  @Type(() => Account, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AwsPlainAccount, name: SessionType.awsplainuser },
      ],
    },
  })
  account: Account;
  sessionId: string;
  profileId: string;
  status: SessionStatus;
  startDateTime: string;
  lastStopDateTime: string;

  constructor(account: Account, profileId: string) {
    this.sessionId = uuid.v4();
    this.profileId = profileId;
    this.status = SessionStatus.inactive;
    this.startDateTime = undefined;
    this.lastStopDateTime = new Date().toISOString();
    this.account = account;
  }

  expired(): boolean {
    const currentTime = new Date().getTime();
    const startTime = new Date(this.startDateTime).getTime();
    return (currentTime - startTime) / 1000 > environment.sessionDuration;
  };
}
