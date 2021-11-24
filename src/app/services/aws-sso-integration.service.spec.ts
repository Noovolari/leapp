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
import {environment} from '../../environments/environment';

describe('AwsSsoIntegrationService', () => {
  const oneHourInMilliseconds: number = 1000 * 60 * 60;
  let service: AwsSsoIntegrationService;
  let spyAppService: SpyObj<AppService>;
  let spyKeychainService: SpyObj<KeychainService>;
  let spyFileService: SpyObj<FileService>;
  let awsSsoOidcService: AwsSsoOidcService;
  let workspaceService: WorkspaceService;

  beforeEach(() => {
    spyAppService = jasmine.createSpyObj('AppService', ['getOS', 'getFollowRedirects']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });
    spyAppService.getFollowRedirects.and.returnValue({
      http: { request: (_: string, callback: any) => ({ end: (): void => {
        callback({ responseUrl: 'http://fake-redirect.portal.url' });
      }})},
      https: { request: (_: string, callback: any) => ({ end: (): void => {
        callback({ responseUrl: 'https://fake-redirect.portal.url' });
      }})}
    });

    spyKeychainService = jasmine.createSpyObj('KeychainService', ['getSecret', 'saveSecret']);
    spyKeychainService.getSecret.and.callFake((_: string, __: string) => 'fake-secret');
    spyKeychainService.saveSecret.and.callFake((_: string, __: string, _3: string) => new Promise((resolve, _4) => {
      resolve();
    }));

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
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
    workspaceService = TestBed.inject(WorkspaceService);

    AwsSsoIntegrationService.init(
      spyAppService,
      awsSsoOidcService,
      TestBed.inject(AwsSsoRoleService),
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
        expect(workspaceService.getAwsSsoIntegration).toHaveBeenCalledTimes(2);
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
});
