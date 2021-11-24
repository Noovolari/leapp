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

describe('AwsSsoIntegrationService', () => {
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
        callback({ responseUrl: 'fake-url' });
      }})},
      https: { request: (_: string, callback: any) => ({ end: (): void => {
        callback({ responseUrl: 'fake-url' });
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
});
