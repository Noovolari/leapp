/*
import { TestBed } from '@angular/core/testing';

import { RetrocompatibilityService } from './retrocompatibility.service';
import {mustInjected} from '../../base-injectables';
import {serialize} from 'class-transformer';
import {Workspace} from '@noovolari/leapp-core/models/workspace';
import {AppService} from './app.service';
import SpyObj = jasmine.SpyObj;
import {KeychainService} from '@noovolari/leapp-core/services/keychain-service';
import {FileService} from '@noovolari/leapp-core/services/file-service';
import { Repository } from '@noovolari/leapp-core/services/repository';

describe('RetrocompatibilityService', () => {
  let service: RetrocompatibilityService;
  let workspaceService: Repository;

  let spyAppService: SpyObj<AppService>;
  let spyFileService;

  let spyKeychain: SpyObj<KeychainService>;

  const mockedOldFile = {
    licence: '',
    uid: '',
    language: 'en',
    avatar: '',
    name: 'default',
    workspaces: [
      {
        defaultLocation: 'eastus',
        defaultRegion: 'us-east-1',
        type: null,
        name: 'default',
        lastIDPToken: null,
        idpUrl: [
          {
            id: 'cb8a78b9-357f-4cb8-965b-655838f068c1',
            url: 'https://accounts.google.com/o/saml2/initsso?idpid=C03eqis8s&spid=1033946587263&forceauthn=false'
          }
        ],
        proxyConfiguration: {
          proxyPort: '8080',
          proxyProtocol: 'https',
          proxyUrl: '',
          username: '',
          password: ''
        },
        sessions: [
          {
            account: {
              region: 'us-east-1',
              role: {
                name: 'ViewOnlyAccess'
              },
              accountId: '198863347786',
              accountName: 'noovolari-dev-account-1',
              accountNumber: '198863347786',
              email: 'info+noovolari-dev-account-1@noovolari.com',
              type: 'aws_sso'
            },
            active: false,
            id: '3217b15f-297c-4dbd-96c6-50860e1b4635',
            lastStopDate: '2021-06-11T12:25:50.325Z',
            loading: false
          },
          {
            account: {
              region: 'us-east-1',
              role: {
                name: 'DatabaseAdministrator'
              },
              accountId: '198863347786',
              accountName: 'noovolari-dev-account-1',
              accountNumber: '198863347786',
              email: 'info+noovolari-dev-account-1@noovolari.com',
              type: 'aws_sso'
            },
            active: false,
            id: '46915c50-5dd1-4c08-86d5-4252ad5bb060',
            lastStopDate: '2021-06-11T12:25:50.325Z',
            loading: false
          },
          {
            id: '5be85f93-04ba-4434-8095-131e24a3f73d',
            active: false,
            loading: false,
            lastStopDate: '2021-06-11T12:25:50.325Z',
            account: {
              accountId: '637114329800',
              accountName: 'main',
              accountNumber: '637114329800',
              role: {
                name: 'alessandro.gaggia',
                roleArn: 'arn:aws:iam::637114329800:role/alessandro.gaggia'
              },
              idpArn: 'arn:aws:iam::637114329800:saml-provider/GoogleApps',
              region: 'eu-west-1',
              idpUrl: 'cb8a78b9-357f-4cb8-965b-655838f068c1',
              type: 'AWS'
            }
          },
          {
            id: 'f1f0f9dc-1d01-4b45-a984-0e8110e8af13',
            active: false,
            loading: false,
            lastStopDate: '2021-06-11T12:25:50.325Z',
            account: {
              accountId: '707579108031',
              accountName: 'noovolari-plain1',
              accountNumber: '707579108031',
              mfaDevice: '',
              region: 'eu-west-1',
              type: 'AWS_PLAIN_USER',
              user: 'test-user'
            }
          },
          {
            id: 'e5ea8ab8-5a27-4787-81a9-a10dc3ddcb22',
            active: false,
            loading: false,
            lastStopDate: '2021-06-11T12:25:50.325Z',
            account: {
              region: 'eastus',
              accountId: '6d5f42d2-0b2a-4372-93da-3d835cb4852c',
              accountName: 'azure',
              subscriptionId: '6d5f42d2-0b2a-4372-93da-3d835cb4852c',
              tenantId: '20f03cc3-841f-412b-8f24-16621d26a8cb',
              type: 'azure'
            }
          }
        ],
        setupDone: true,
        azureProfile: null,
        azureConfig: null
      },
      {
        defaultLocation: 'eastus',
        defaultRegion: 'us-east-1',
        type: null,
        name: 'default',
        lastIDPToken: null,
        idpUrl: [],
        proxyConfiguration: {
          proxyPort: '8080',
          proxyProtocol: 'https',
          proxyUrl: '',
          username: '',
          password: ''
        },
        sessions: [],
        setupDone: true,
        azureProfile: null,
        azureConfig: null
      }
    ],
    defaultWorkspace: 'default'
  };

  beforeEach(() => {

    spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
    spyFileService.exists.and.returnValue(true);
    spyFileService.newDir.and.returnValue(true);
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
    spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );

    spyKeychain = jasmine.createSpyObj('KeychainService', ['getSecret', 'saveSecret']);
    spyKeychain.getSecret.and.callFake((serv: string, account: string) => serv + '_' + account);
    spyKeychain.saveSecret.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        RetrocompatibilityService,
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService },
        { provide: KeychainService, useValue: spyKeychain }
      ].concat(mustInjected())
    });

    service = TestBed.inject(RetrocompatibilityService);
    workspaceService = TestBed.inject(Repository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isRetroPatchNecessary', () => {
    it('should indicate true if a specific key is present in the file', () => {
      const retroService = TestBed.inject(RetrocompatibilityService);

      spyFileService.decryptText.and.callFake((text: string) => JSON.stringify(mockedOldFile));
      expect(retroService.isRetroPatchNecessary()).toEqual(true);
    });

    it('should indicate false if file is not present', () => {
      const retroService = TestBed.inject(RetrocompatibilityService);
      spyFileService.exists.and.returnValue(false);
      expect(retroService.isRetroPatchNecessary()).toEqual(false);
    });

    it('should indicate false if key is not there', () => {
      const retroService = TestBed.inject(RetrocompatibilityService);

      spyFileService.decryptText.and.callFake((text: string) => JSON.stringify({}));
      expect(retroService.isRetroPatchNecessary()).toEqual(false);
    });

    it('should return a default workspace if false', () => {
      workspaceService = TestBed.inject(Repository);

      const retroService = TestBed.inject(RetrocompatibilityService);
      spyFileService.decryptText.and.callFake((text: string) => JSON.stringify({}));
      expect(retroService.isRetroPatchNecessary()).toEqual(false);

      const workspace = new Workspace();
      workspace.profiles = workspaceService.getProfiles();

      expect(JSON.stringify(workspace)).toEqual(JSON.stringify(workspaceService.getWorkspace()));
    });
  });

  describe('adaptOldWorkspaceFile', () => {
    it('should return a modern copy of the workspace', async () => {

      const retroService = TestBed.inject(RetrocompatibilityService);

      spyFileService.decryptText.and.callFake((text: string) => JSON.stringify(mockedOldFile));

      const workspace = new Workspace();

      workspace.defaultLocation = 'eastus';
      workspace.defaultRegion = 'us-east-1';

      workspace.idpUrls = mockedOldFile.workspaces[0].idpUrl;

      const returnedWorkspace = await retroService.adaptOldWorkspaceFile();

      workspace.sessions = returnedWorkspace.sessions;
      workspace.profiles = returnedWorkspace.profiles;
      workspace.proxyConfiguration = mockedOldFile.workspaces[0].proxyConfiguration;

      workspace.awsSsoConfiguration.region = 'Leapp_AWS_SSO_REGION';
      workspace.awsSsoConfiguration.portalUrl = 'Leapp_AWS_SSO_PORTAL_URL';
      workspace.awsSsoConfiguration.expirationTime = 'Leapp_AWS_SSO_EXPIRATION_TIME';

      spyFileService.decryptText.and.callFake((text: string) => JSON.stringify(new Workspace()));

      expect(returnedWorkspace).toEqual(workspace);
      expect((returnedWorkspace as any).defaultWorkspace).toBe(undefined);
      expect((returnedWorkspace as any).avatar).toBe(undefined);
      expect((returnedWorkspace as any).workspaces).toBe(undefined);
    });
  });
});
*/

import { describe, test, expect } from "@jest/globals";
import { RetroCompatibilityService } from "./retro-compatibility-service";

describe("RetroCompatibilityService", () => {
  test("Should exists when created", () => {
    const fileService = {};
    const keychainService = {};
    const repository = {};
    const workspaceService = {};
    const appName = "test";
    const lockPath = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(new RetroCompatibilityService(fileService, keychainService, repository, workspaceService, appName, lockPath)).not.toBe(undefined);
  });
});
