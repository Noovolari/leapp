import {TestBed} from '@angular/core/testing';

import {AwsPlainService} from './aws-plain.service';
import {mustInjected} from '../../../base-injectables';
import {serialize} from 'class-transformer';
import {Workspace} from '../../models/workspace';
import {AppService} from '../app.service';
import {FileService} from '../file.service';
import {WorkspaceService} from '../workspace.service';
import {Session} from '../../models/session';
import {KeychainService} from '../keychain.service';
import {environment} from '../../../environments/environment';
import {LeappBaseError} from '../../errors/leapp-base-error';

import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import {AwsPlainAccount} from '../../models/aws-plain-account';

let spyAppService;
let spyFileService;
let spyWorkspaceService;
let spyKeychainService;

let awsPlainService: AwsPlainService;

let mockedSessions: Session[] = [];
let mockedSecret;
let mockedCredentialObject;

describe('AwsPlainService', () => {

  beforeEach(() => {
    spyAppService = jasmine.createSpyObj('AppService', ['getOS', 'awsCredentialPath', 'stsOptions', 'inputDialog']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });
    spyAppService.awsCredentialPath.and.returnValue('~/.aws');
    spyAppService.stsOptions.and.returnValue({});

    spyFileService = jasmine.createSpyObj('FileService', [
      'encryptText', 'decryptText', 'iniWriteSync', 'iniParseSync',
      'replaceWriteSync', 'writeFileSync', 'readFileSync', 'exists', 'newDir'
    ]);

    spyFileService.exists.and.returnValue(true);
    spyFileService.newDir.and.returnValue(true);
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
    spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );
    spyFileService.iniWriteSync.and.callFake((_: string, object: any) => {
      mockedCredentialObject = object;
    });

    spyWorkspaceService = jasmine.createSpyObj('WorkspaceService', ['addSession', 'getProfileName']);
    spyWorkspaceService.addSession.and.callFake((session: Session) => {
      mockedSessions.push(session);
    });

    spyWorkspaceService.getProfileName.and.returnValue('default');

    spyKeychainService = jasmine.createSpyObj('KeychainService' , ['saveSecret', 'getSecret']);
    spyKeychainService.saveSecret.and.callFake((name: string, account: string, secret: string) => {
      mockedSecret = {};
      mockedSecret[name] = {};
      mockedSecret[name][account] = secret;
    });

    spyKeychainService.getSecret.and.callFake((_: string, _2: string, _3: string) => 'fake-secret');

    TestBed.configureTestingModule({
      providers: [
        { provide: WorkspaceService, useValue: spyWorkspaceService },
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService },
        { provide: KeychainService, useValue: spyKeychainService }
      ].concat(mustInjected())
    });

    awsPlainService = TestBed.inject(AwsPlainService);
  });

  it('should be created', () => {
    const service: AwsPlainService = TestBed.inject(AwsPlainService);
    expect(service).toBeTruthy();
  });

  describe('create()', () => {
    it('should create a new Account of type Plain', () => {
      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');

      expect(spyWorkspaceService.addSession).toHaveBeenCalled();
      expect(mockedSessions.length).toBe(1);
      expect(spyKeychainService.saveSecret).toHaveBeenCalledTimes(2);
      expect(spyKeychainService.saveSecret).toHaveBeenCalledWith(environment.appName, `${mockedSessions[0].sessionId}-plain-aws-session-access-key-id`, 'access-key');
      expect(spyKeychainService.saveSecret).toHaveBeenCalledWith(environment.appName, `${mockedSessions[0].sessionId}-plain-aws-session-secret-access-key`, 'secret-key');
    });
  });

  describe('applyCredentials()', () => {
    it('should apply the set of credential to the profile', (done) => {
      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');

      spyOn(awsPlainService, 'get').and.callFake((_: string) => mockedSessions[0]);

      const credentialsInfo = {
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: 'access-key',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: 'secret-key',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: 'sessionToken'
        }
      };

      awsPlainService.applyCredentials(mockedSessions[0].sessionId, credentialsInfo);

      const caller = setTimeout(()=> {
        expect(awsPlainService.get).toHaveBeenCalled();
        expect(spyFileService.iniWriteSync).toHaveBeenCalledTimes(1);
        expect(spyFileService.iniWriteSync).toHaveBeenCalledWith('~/.aws', {
          default: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            aws_session_token: credentialsInfo.sessionToken.aws_session_token,
            region: 'eu-west-1'
          }
        });
        done();
        clearTimeout(caller);
      }, 200);
    });
  });

  describe('deApplyCredentials()', () => {
    it('should remove the set of credential to the profile', (done) => {
      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');

      spyOn(awsPlainService, 'get').and.callFake((_: string) => mockedSessions[0]);

      const credentialsInfo = {
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: 'access-key',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: 'secret-key',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: 'sessionToken'
        }
      };

      const credentialFakeObject = {
        default: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: credentialsInfo.sessionToken.aws_session_token,
          region: 'eu-west-1'
        }
      };

      spyFileService.iniParseSync.and.callFake( () => credentialFakeObject);
      spyFileService.replaceWriteSync.and.callFake( () => {});

      awsPlainService.deApplyCredentials(mockedSessions[0].sessionId);

      const caller = setTimeout(()=> {
        expect(awsPlainService.get).toHaveBeenCalled();
        expect(spyFileService.iniParseSync).toHaveBeenCalledTimes(1);
        expect(spyFileService.replaceWriteSync).toHaveBeenCalledWith('~/.aws', {});
        done();
        clearTimeout(caller);
      }, 200);
    });
  });

  describe('generateCredentials()',  () => {
    it('should generate a Credential Info Promise if token is expired', async () => {

      AWSMock.setSDKInstance(AWS);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWSMock.mock('STS', 'getSessionToken', (params: { DurationSeconds: number }, callback: any) => {
        callback(null, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Credentials: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            AccessKeyId: 'access-key-id-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SecretAccessKey: 'secret-key-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SessionToken: 'session-token'
          }
        });
      });

      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');
      (mockedSessions[0].account as AwsPlainAccount).sessionTokenExpiration = new Date(Date.now() - environment.sessionTokenDuration - 1000).toISOString();

      spyOn(awsPlainService, 'get').and.callFake((_: string) => mockedSessions[0]);
      spyOn(awsPlainService, 'generateCredentials').and.callThrough();
      spyOn<any>(awsPlainService, 'saveSessionTokenResponseInTheSession').and.callFake(() => true);

      const credentials = await awsPlainService.generateCredentials('fakeid');
      expect(credentials).toEqual({
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: 'access-key-id-1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: 'secret-key-1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: 'session-token',
        }
      });

      AWSMock.restore('STS');
    });

    it('should ask for MFA code if token is expired and mfadevice is present as a property of aws plain account', async () => {

      AWSMock.setSDKInstance(AWS);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWSMock.mock('STS', 'getSessionToken', (params: { DurationSeconds: number }, callback: any) => {
        callback(null, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Credentials: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            AccessKeyId: 'access-key-id-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SecretAccessKey: 'secret-key-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SessionToken: 'session-token'
          }
        });
      });

      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');
      (mockedSessions[0].account as AwsPlainAccount).mfaDevice = 'fake-device-arn';
      (mockedSessions[0].account as AwsPlainAccount).sessionTokenExpiration = new Date(Date.now() - 10000).toISOString();

      spyOn(awsPlainService, 'get').and.callFake((_: string) => mockedSessions[0]);
      spyOn(awsPlainService, 'generateCredentials').and.callThrough();
      spyOn<any>(awsPlainService, 'generateSessionToken').and.callFake(() => true);

      spyAppService.inputDialog.and.callFake((_: string, _2: string, _3: string, callback: any) => callback('fake-code'));

      await awsPlainService.generateCredentials('fakeid');

      expect(spyAppService.inputDialog).toHaveBeenCalled();
      expect((awsPlainService as any).generateSessionToken).toHaveBeenCalled();

      AWSMock.restore('STS');
    });

    it('should retrieve Credential Info from keychain if token is NOT expired', async () => {

      AWSMock.setSDKInstance(AWS);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWSMock.mock('STS', 'getSessionToken', (params: { DurationSeconds: number }, callback: any) => {
        callback(null, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Credentials: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            AccessKeyId: 'access-key-id-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SecretAccessKey: 'secret-key-1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SessionToken: 'session-token'
          }
        });
      });

      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');
      // Fake date in the future to prevent token expiration
      (mockedSessions[0].account as AwsPlainAccount).sessionTokenExpiration = new Date(Date.now() + 1000).toISOString();

      spyOn(awsPlainService, 'get').and.callFake((_: string) => mockedSessions[0]);
      spyOn(awsPlainService, 'generateCredentials').and.callThrough();

      // We need to spy on iniParseFile
      const credentialFakeObject = {
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: 'access-key-id-file',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: 'secret-key-file',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: 'session-token-file'
        }
      };

      spyKeychainService.getSecret.and.returnValue(JSON.stringify(credentialFakeObject));

      const credentials = await awsPlainService.generateCredentials('fakeid');

      expect(credentials).toEqual({
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: 'access-key-id-file',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: 'secret-key-file',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: 'session-token-file',
        }
      });

      AWSMock.restore('STS');
    });

    it('should manage Error in its proper way and thrown the info up one level short after', async () => {
      mockedSessions = [];
      awsPlainService.create({accountName: 'fakeaccount', region: 'eu-west-1', accessKey: 'access-key', secretKey: 'secret-key'}, 'default');

      spyOn(awsPlainService, 'get').and.callFake((_: string) => mockedSessions[0]);
      spyOn(awsPlainService, 'generateCredentials').and.callThrough();

      // Trick to test throwing error: basically we catch the error and confront it instead of checking throwError
      // https://stackoverflow.com/questions/44876306/jasmine-expecting-error-to-be-thrown-in-a-async-function
      let error;
      try {
        await awsPlainService.generateCredentials('fakeid');
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(LeappBaseError);
    });
  });
});
