import {SessionType} from './session-type';
import {Account} from './account';

export class AwsPlainAccount extends Account {
  accountName: string;
  region: string;
  mfaDevice?: string;
  type: SessionType;

  constructor(accountName: string, region: string, mfaDevice?: string) {
    super(accountName, region);
    this.mfaDevice = mfaDevice;
    this.type = SessionType.awsplainuser;
  }
}

