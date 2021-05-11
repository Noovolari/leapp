import {TestBed} from '@angular/core/testing';
import {sessionServiceProvider} from './session-service.provider';
import {mustInjected} from '../../../base-injectables';
import {SessionService} from '../session.service';
import {AccountType} from '../../models/AccountType';
import {WorkspaceService} from '../workspace.service';
import {KeychainService} from '../keychain.service';
import {AppService} from '../app.service';
import {FileService} from '../file.service';

describe('SessionServiceProvider', () => {
  let workspaceService;
  let keychainService;
  let appService;
  let fileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [sessionServiceProvider, WorkspaceService, KeychainService, AppService, FileService].concat(mustInjected())
    });

    workspaceService = TestBed.inject(WorkspaceService);
  });

  it('should be created', () => {
    const service: SessionService = TestBed.get(sessionServiceProvider.useFactory(AccountType.AWS_PLAIN_USER, workspaceService, keychainService, appService, fileService));
    expect(service).toBeTruthy();
  });
});
