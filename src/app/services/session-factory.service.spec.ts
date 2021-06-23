import {TestBed} from '@angular/core/testing';

import {SessionFactoryService} from './session-factory.service';
import {mustInjected} from '../../base-injectables';
import {AwsSessionService} from './session/aws/aws-session.service';
import {SessionType} from '../models/session-type';
import {AwsIamUserService} from './session/aws/methods/aws-iam-user.service';
import {WorkspaceService} from './workspace.service';
import {KeychainService} from './keychain.service';
import {AppService} from './app.service';
import {FileService} from './file.service';
import {Workspace} from '../models/workspace';

describe('SessionProviderService', () => {
  let sessionFactoryService: SessionFactoryService;

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
    sessionFactoryService = TestBed.inject(SessionFactoryService);
  });

  it('should be created', () => {
    expect(sessionFactoryService).toBeTruthy();
  });

  it('should return a Aws Plain Service when requested with AccountType AWS_PLAIN_USER', () => {
    const awsPlainService: AwsSessionService = sessionFactoryService.getService(SessionType.awsIamUser) as AwsSessionService;
    expect(awsPlainService).toBeInstanceOf(AwsIamUserService);
  });

  it('should return the same Service (Singleton) when requested more than one time', () => {
    const awsPlainService: AwsSessionService = sessionFactoryService.getService(SessionType.awsIamUser) as AwsSessionService;
    const awsPlainServiceCopy: AwsSessionService = sessionFactoryService.getService(SessionType.awsIamUser) as AwsSessionService;
    const awsPlainServiceCopy2: AwsSessionService = sessionFactoryService.getService(SessionType.awsIamUser) as AwsSessionService;

    expect(awsPlainService).toEqual(awsPlainServiceCopy);
    expect(awsPlainServiceCopy).toEqual(awsPlainServiceCopy2);
  });
});
