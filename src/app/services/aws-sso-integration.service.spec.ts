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
import {AwsSsoRoleSession} from "../models/aws-sso-role-session";
import {SSO} from "aws-sdk";
import AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";

describe('AwsSsoIntegrationService', () => {
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
        callback({ responseUrl: 'fake-url' });
      }})},
      https: { request: (_: string, callback: any) => ({ end: (): void => {
        callback({ responseUrl: 'fake-url' });
      }})}
    });

    spyKeychainService = jasmine.createSpyObj('KeychainService', ['getSecret', 'saveSecret', 'deletePassword']);
    spyKeychainService.getSecret.and.callFake((_: string, __: string) => 'fake-secret');
    spyKeychainService.saveSecret.and.callFake((_: string, __: string, _3: string) => new Promise((resolve, _4) => {
      resolve();
    }));
    spyKeychainService.deletePassword.and.callFake((_: string, __: string) => new Promise((resolve, _) => resolve(true)));

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
    it('invokes isAwsSsoAccessTokenExpired once', async () => {
      const fakeId = 'fake-id';
      const workspace: Workspace = new Workspace();

      workspace.awsSsoIntegrations.push({
        id: 'fake-id',
        alias: 'fake-alias',
        portalUrl: 'fake-portal-url',
        region: 'fake-region',
        accessTokenExpiration: new Date(Date.now()).toISOString(),
        browserOpening: 'fake-browser-opening'
      });

      spyOn<any>(awsSsoOidcService, 'login').and.returnValue({
        accessToken: 'fake-access-token',
        expirationTime: new Date(Date.now() + (1000 * 60 * 60))
      });
      spyOn<any>(workspaceService, 'getWorkspace').and.returnValue(workspace);
      spyOn<any>(service, 'isAwsSsoAccessTokenExpired').and.callThrough();

      await service.login(fakeId);

      expect(service.isAwsSsoAccessTokenExpired).toHaveBeenCalledOnceWith(fakeId);
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
        // removed session of a specific integration id
        expect(workspace.sessions.filter((sess) => (sess as AwsSsoRoleSession).awsSsoConfigurationId === fakeId).length).toBe(0);

        clearTimeout(caller);
      }, 1000);
    });

  });
});
