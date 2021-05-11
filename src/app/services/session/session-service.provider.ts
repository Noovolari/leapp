import {AccountType} from '../../models/AccountType';
import {SessionService} from '../session.service';
import {AwsPlainService} from './aws-plain.service';
import {WorkspaceService} from '../workspace.service';
import {KeychainService} from '../keychain.service';
import {AppService} from '../app.service';
import {FileService} from '../file.service';

const sessionServiceFactory = (
  accountType: AccountType,
  workspaceService: WorkspaceService,
  keyChainService: KeychainService,
  appService: AppService,
  fileService: FileService
): SessionService => {
  switch (accountType) {
    case(AccountType.AWS): return null;
    case(AccountType.AZURE): return null;
    case(AccountType.AWS_PLAIN_USER): return new AwsPlainService(workspaceService, keyChainService, appService, fileService);
    case(AccountType.AWS_SSO): return null;
  }
};

export const sessionServiceProvider = {
  provide: SessionService,
  useFactory: sessionServiceFactory,
  deps: [
    WorkspaceService,
    KeychainService,
    AppService,
    FileService
  ]
};
