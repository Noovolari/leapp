import { TestBed } from '@angular/core/testing';
import { AwsSsoIntegrationService } from './aws-sso-integration.service';
import {WorkspaceService} from './workspace.service';
import {AppService} from './app.service';
import {KeychainService} from './keychain.service';
import {mustInjected} from '../../base-injectables';
import SpyObj = jasmine.SpyObj;
import {AwsSsoOidcService} from './aws-sso-oidc.service';
import {AwsSsoRoleService} from './session/aws/methods/aws-sso-role.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {serialize} from 'class-transformer';
import {Workspace} from '../models/workspace';
import {FileService} from './file.service';
import {AwsSsoRoleSession} from '../models/aws-sso-role-session';
import AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import {environment} from '../../environments/environment';

describe('AwsSsoIntegrationService', () => {
  const oneHourInMilliseconds: number = 1000 * 60 * 60;
  let service: AwsSsoIntegrationService;
  let spyAppService: SpyObj<AppService>;
  let spyKeychainService: SpyObj<KeychainService>;
  let spyFileService: SpyObj<FileService>;
  let awsSsoOidcService: AwsSsoOidcService;
  let workspaceService: WorkspaceService;
  let awsSsoRoleService: AwsSsoRoleService;

  beforeEach(() => {
    spyAppService = jasmine.createSpyObj('AppService', ['getOS', 'getFollowRedirects', 'awsCredentialPath']);
    spyAppService.awsCredentialPath.and.returnValue('');
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });
    spyAppService.getFollowRedirects.and.returnValue({
      http: { request: (_: string, callback: any) => ({ end: (): void => {
        callback({ responseUrl: 'http://fake-redirect.portal.url' });
      }})},
      https: { request: (_: string, callback: any) => ({ end: (): void => {
        callback({ responseUrl: 'https://fake-redirect.portal.url' });
      }})}
    });

    spyKeychainService = jasmine.createSpyObj('KeychainService', ['getSecret', 'saveSecret', 'deletePassword']);
    spyKeychainService.getSecret.and.callFake((_: string, __: string) => 'fake-secret');
    spyKeychainService.saveSecret.and.callFake((_: string, __: string, _3: string) => new Promise((resolve, _4) => {
      resolve();
    }));
    spyKeychainService.deletePassword.and.callFake((_: string, __: string) => new Promise((resolve, _3) => resolve(true)));

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir', 'iniParseSync', 'replaceWriteSync']);
    spyFileService.iniParseSync.and.returnValue('');
    spyFileService.replaceWriteSync.and.returnValue('');
    spyFileService.exists.and.returnValue(true);
    spyFileService.newDir.and.returnValue();
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
    spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );

    TestBed.configureTestingModule({
      providers: [
        BsModalService,
        { provide: AppService, useValue: spyAppService },
        { provide: KeychainService, useValue: spyKeychainService },
        { provide: FileService, useValue: spyFileService },
        AwsSsoOidcService,
        AwsSsoRoleService,
        WorkspaceService
      ].concat(mustInjected())
    });

    awsSsoOidcService = TestBed.inject(AwsSsoOidcService);
    awsSsoRoleService = TestBed.inject(AwsSsoRoleService);
    workspaceService = TestBed.inject(WorkspaceService);

    AwsSsoIntegrationService.init(
      spyAppService,
      awsSsoOidcService,
      awsSsoRoleService,
      TestBed.inject(KeychainService),
      workspaceService
    );

    service = AwsSsoIntegrationService.getInstance();
  });

  describe('login', () => {
    const fakeAccessToken = 'fake-access-token';
    let expirationTime: Date;

    beforeEach(() => {
      expirationTime = new Date(Date.now() + oneHourInMilliseconds);

      spyOn<any>(awsSsoOidcService, 'login').and.returnValue({
        accessToken: fakeAccessToken,
        expirationTime
      });
    });

    it('invokes isAwsSsoAccessTokenExpired once', async () => {
      const workspace: Workspace = new Workspace();

      workspace.awsSsoIntegrations.push({
        id: 'fake-id',
        alias: 'fake-alias',
        portalUrl: 'https://fake.portal.url',
        region: 'fake-region',
        accessTokenExpiration: new Date(Date.now()).toISOString(),
        browserOpening: 'fake-browser-opening'
      });

      spyOn<any>(workspaceService, 'getWorkspace').and.returnValue(workspace);
      spyOn<any>(service, 'isAwsSsoAccessTokenExpired').and.callThrough();

      await service.login('fake-id');

      expect(service.isAwsSsoAccessTokenExpired).toHaveBeenCalledOnceWith('fake-id');
    });

    describe('if the AwsSsoIntegration\'s access token is expired', () => {
      beforeEach(() => {
        const workspace: Workspace = new Workspace();
        const expiredAccessTokenExpiration = new Date(Date.now() - oneHourInMilliseconds).toISOString();

        workspace.awsSsoIntegrations.push({
          id: 'fake-id',
          alias: 'fake-alias',
          portalUrl: 'https://fake.portal.url',
          region: 'fake-region',
          accessTokenExpiration: expiredAccessTokenExpiration,
          browserOpening: 'fake-browser-opening'
        });

        spyOn<any>(workspaceService, 'getWorkspace').and.returnValue(workspace);
      });

      it('isAwsSsoAccessTokenExpired returns true', async () => {
        spyOn<any>(service, 'isAwsSsoAccessTokenExpired').and.callThrough();
        await service.login('fake-id');
        expect(service.isAwsSsoAccessTokenExpired).toBeTruthy();
      });

      it('retrieves the AwsSsoIntegration object', async () => {
        spyOn<any>(workspaceService, 'getAwsSsoIntegration').and.callThrough();
        await service.login('fake-id');
        expect(workspaceService.getAwsSsoIntegration).toHaveBeenCalledTimes(3);
        expect(workspaceService.getAwsSsoIntegration).toHaveBeenCalledWith('fake-id');
      });

      it('resolves the AwsSsoIntegration\'s portalUrl by following redirects', async () => {
        await service.login('fake-id');
        const updatedAwsSsoConfiguration = workspaceService.getAwsSsoIntegration('fake-id');
        expect(updatedAwsSsoConfiguration.portalUrl).toEqual('https://fake-redirect.portal.url');
      });

      it('generates the AwsSsoIntegration\'s access token through AwsSsoOidcService\'s login method', async () => {
        await service.login('fake-id');
        const updatedAwsSsoConfiguration = workspaceService.getAwsSsoIntegration('fake-id');
        expect(awsSsoOidcService.login).toHaveBeenCalledOnceWith(updatedAwsSsoConfiguration);
      });

      it('updates the AwsSsoConfiguration with the generated AwsSsoConfiguration\'s access token', async () => {
        spyOn<any>(workspaceService, 'updateAwsSsoIntegration').and.callThrough();
        await service.login('fake-id');
        expect(workspaceService.updateAwsSsoIntegration).toHaveBeenCalledOnceWith(
          'fake-id',
          'fake-alias',
          'fake-region',
          'https://fake-redirect.portal.url',
          'fake-browser-opening',
          expirationTime.toISOString(),
        );
      });

      it('saves the generated AwsSsoConfiguration\'s access token in the keychain as aws-sso-integration-access-token-fake-id', async () => {
        await service.login('fake-id');
        expect(spyKeychainService.saveSecret).toHaveBeenCalledOnceWith(
          environment.appName,
          'aws-sso-integration-access-token-fake-id',
          fakeAccessToken
        );
      });
    });
  });

  describe('logout',  () => {
    it('invokes logout once and remove sessions of a configuration id, remove expiration times and calls all relevant methods', async () => {
      const fakeId = 'fake-id';
      const workspace: Workspace = new Workspace();

      workspace.awsSsoIntegrations.push({
        id: fakeId,
        alias: 'fake-alias',
        portalUrl: 'fake-portal-url',
        region: 'fake-region',
        accessTokenExpiration: new Date(Date.now()).toISOString(),
        browserOpening: 'fake-browser-opening'
      });

      workspace.awsSsoIntegrations.push({
        id: 'sub-test-ckeck',
        alias: 'fake-alias-2',
        portalUrl: 'fake-portal-url-2',
        region: 'eu-west-1',
        accessTokenExpiration: new Date(Date.now()).toISOString(),
        browserOpening: 'fake-browser-opening-2'
      });

      workspace.sessions.push(new AwsSsoRoleSession(
        'fake-name',
        'fake.region',
        'fake-arn',
        'fake-profile',
        fakeId,
        'fake-email'
      ));
      workspaceService.sessions = [...workspace.sessions];

      spyOn<any>(workspaceService, 'getWorkspace').and.returnValue(workspace);
      spyOn<any>(workspaceService, 'getAwsSsoIntegration').and.callThrough();

      spyOn<any>(service, 'getAwsSsoIntegrationTokenInfo').and.returnValue(
        new Promise((resolve, _) => resolve({
          accessToken: 'fake-token',
          expiration: new Date(workspaceService.getAwsSsoIntegration(fakeId).accessTokenExpiration).getTime()
        }))
      );

      spyOn<any>(service, 'getSsoPortalClient').and.callThrough();

      AWSMock.setSDKInstance(AWS);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWSMock.mock('SSO', 'logout', (_: any) => true);

      spyOn<any>(workspaceService, 'removeSession').and.callThrough();
      spyOn<any>(awsSsoRoleService, 'stop').and.callFake((_: string) => new Promise((resolve, __) => resolve(true)));

      // We check that we have sessions now
      expect(workspaceService.sessions.length).toBe(1);

      await service.logout(fakeId);

      const caller = setTimeout(()=> {
        // Called all important internal methods
        expect(workspaceService.getAwsSsoIntegration).toHaveBeenCalledTimes(2);
        expect(service.getAwsSsoIntegrationTokenInfo).toHaveBeenCalledTimes(1);
        expect(workspaceService.removeSession).toHaveBeenCalled();
        expect(awsSsoRoleService.stop).toHaveBeenCalled();
        // Removed secret from keychain
        expect(spyKeychainService.deletePassword).toHaveBeenCalled();
        // Removed expiration time
        expect(workspace.awsSsoIntegrations[0].accessTokenExpiration).not.toBeDefined();
        // removed sessions of a specific integration id
        expect(workspace.sessions.filter((sess) => (sess as AwsSsoRoleSession).awsSsoConfigurationId === fakeId).length).toBe(0);

        clearTimeout(caller);
      }, 1000);
    });

  });

  describe('provisionSessions', () => {
    it('calls all the internal methods and provides an array of sessions equal to the length of account retrieved, given a specific configuration', async () => {
      const fakeId = 'fake-id';
      const fakeRole = {
        id: 'fake-id-role',
        name: 'fake-role',
        arn: 'fake-arn'
      };
      const workspace: Workspace = new Workspace();
      const notExpiredAccessTokenExpiration = new Date(Date.now() + oneHourInMilliseconds).toISOString();

      workspace.awsSsoIntegrations.push({
        id: fakeId,
        alias: 'fake-alias',
        portalUrl: 'https://fake.portal.url',
        region: 'eu-west-1',
        accessTokenExpiration: notExpiredAccessTokenExpiration,
        browserOpening: 'fake-browser-opening'
      });

      spyOn(service, 'login').and.callFake((_: string): Promise<void> => new Promise((resolve, __) => {
        resolve();
      }));

      spyOn<any>(workspaceService, 'getAwsSsoIntegration').and.returnValue(workspace.awsSsoIntegrations[0]);

      spyOn<any>(service, 'getAwsSsoIntegrationTokenInfo').and.returnValue(
        new Promise((resolve, _) => resolve({
          accessToken: 'fake-token',
          expiration: new Date(workspaceService.getAwsSsoIntegration(fakeId).accessTokenExpiration).getTime()
        }))
      );

      spyOn<any>(service, 'getSsoPortalClient').and.callThrough();

      spyOn<any>(service, 'findOldSession').and.callThrough();

      spyOn<any>(service, 'listAccounts').and.returnValue(
        new Promise((resolve, _) => resolve(
          [
            {
              accountId: 'fake-id',
              accountName: 'fake-name',
              emailAddress: 'fake-email'
            }
          ]
        ))
      );

      spyOn<any>(service, 'recursiveListRoles').and.callFake((rolesToBeFilled, _, resolve) => {
        rolesToBeFilled.push(fakeRole);
        resolve(true);
      });

      spyOn<any>(workspaceService, 'removeSession').and.callThrough();
      spyOn<any>(awsSsoRoleService, 'stop').and.callFake((_: string) => new Promise((resolve, __) => resolve(true)));
      spyOn<any>(workspaceService, 'getWorkspace').and.returnValue(workspace);

      const sessions = await service.provisionSessions('fake-id');

      const caller = setTimeout(() => {
        expect(workspaceService.getAwsSsoIntegration).toHaveBeenCalledTimes(2);
        expect(service.getAwsSsoIntegrationTokenInfo).toHaveBeenCalledTimes(1);
        expect((service as any).findOldSession).toHaveBeenCalledTimes(1);
        expect(workspaceService.removeSession).toHaveBeenCalled();
        expect(awsSsoRoleService.stop).toHaveBeenCalled();
        expect(sessions).toBe(
          [{
            email: 'fake-email',
            region: 'us-east-1',
            roleArn: 'arn:aws:iam::fake-id/undefined',
            sessionName: 'fake-name',
            profileId: 'ec23a3db-551c-4527-bb63-1abfacad2955',
            awsSsoConfigurationId: 'fake-id'
          }]
        );
        clearTimeout(caller);
      }, 1000);
    });
  });
});
