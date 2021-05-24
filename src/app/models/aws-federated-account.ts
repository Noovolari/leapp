import {SessionType} from './session-type';
import {Account} from './account';

export class AwsFederatedAccount extends Account {
  accountName: string;
  roleArn: string ;
  idpArn: string;
  idpUrl: string;
  type: SessionType;
  region: string;
  profileId: string;

  constructor(accountName: string, region: string, idpUrl: string, idpArn: string, roleArn: string, profileId: string) {
    super(accountName, region);
    this.type = SessionType.awsFederated;

    this.accountName = accountName;
    this.region = region;
    this.idpUrl = idpUrl;
    this.idpArn = idpArn;
    this.roleArn = roleArn;
    this.profileId = profileId;
  }
}
