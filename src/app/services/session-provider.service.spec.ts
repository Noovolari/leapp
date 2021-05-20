import {TestBed} from '@angular/core/testing';

import {SessionProviderService} from './session-provider.service';
import {mustInjected} from '../../base-injectables';
import {SessionService} from './session.service';
import {SessionType} from '../models/session-type';
import {AwsPlainService} from './session/aws-plain.service';
import {WorkspaceService} from './workspace.service';
import {KeychainService} from './keychain.service';
import {AppService} from './app.service';
import {FileService} from './file.service';
import {Workspace} from '../models/workspace';

describe('SessionProviderService', () => {
  let sessionProvider: SessionProviderService;

  const spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
  spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

  const spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists']);
  spyFileService.exists.and.returnValue(true);
  spyFileService.encryptText.and.callFake((text: string) => text);
  spyFileService.decryptText.and.callFake((text: string) => text);
  spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
  spyFileService.readFileSync.and.callFake((_: string) => JSON.stringify(new Workspace()) );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkspaceService,
        KeychainService,
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService }
      ].concat(mustInjected())
    });
    sessionProvider = TestBed.inject(SessionProviderService);
  });

  it('should be created', () => {
    expect(sessionProvider).toBeTruthy();
  });

  it('should return a Aws Plain Service when requested with AccountType AWS_PLAIN_USER', () => {
    const awsPlainService: SessionService = sessionProvider.getService(SessionType.awsPlain);
    expect(awsPlainService).toBeInstanceOf(AwsPlainService);
  });

  it('should return the same Service (Singleton) when requested more than one time', () => {
    const awsPlainService: SessionService = sessionProvider.getService(SessionType.awsPlain);
    const awsPlainServiceCopy: SessionService = sessionProvider.getService(SessionType.awsPlain);
    const awsPlainServiceCopy2: SessionService = sessionProvider.getService(SessionType.awsPlain);

    expect(awsPlainService).toEqual(awsPlainServiceCopy);
    expect(awsPlainServiceCopy).toEqual(awsPlainServiceCopy2);
  });
});
