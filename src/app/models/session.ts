import {Account} from './account';
import * as uuid from 'uuid';
import {Type} from 'class-transformer';
import {AwsPlainAccount} from './aws-plain-account';
import {SessionType} from './session-type';
import {environment} from '../../environments/environment';
import {SessionStatus} from './session-status';
import {AwsTrusterAccount} from './aws-truster-account';
import {AwsFederatedAccount} from './aws-federated-account';

export class Session {
  @Type(() => Account, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AwsFederatedAccount, name: SessionType.awsFederated },
        { value: AwsPlainAccount, name: SessionType.awsPlain },
        { value: AwsTrusterAccount, name: SessionType.awsTruster },
      ],
    },
  })
  account: Account;

  parentSessionId?: string;

  sessionId: string;

  status: SessionStatus;
  startDateTime: string;
  lastStopDateTime: string;

  constructor(account: Account, parentSessionId?: string) {
    this.sessionId = uuid.v4();
    this.parentSessionId = parentSessionId;
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
