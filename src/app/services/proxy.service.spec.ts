import {TestBed} from '@angular/core/testing';

import {ProxyService} from './proxy.service';
import {mustInjected} from '../../base-injectables';
import {WorkspaceService} from './workspace.service';
import {serialize} from 'class-transformer';
import {Workspace} from '../models/workspace';
import {AppService} from './app.service';

import SpyObj = jasmine.SpyObj;
import {FileService} from './file.service';

describe('ProxyService', () => {
  let service: ProxyService;

  let spyAppService: SpyObj<AppService>;
  let spyFileService;

  beforeEach(() => {
    spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
    spyAppService.getOS.and.returnValue({homedir: () => '~/testing'});

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
    spyFileService.exists.and.returnValue(true);
    spyFileService.newDir.and.returnValue(true);
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {
    });
    spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()));

    TestBed.configureTestingModule({
      providers: [
        ProxyService,
        WorkspaceService,
        {provide: AppService, useValue: spyAppService},
        {provide: FileService, useValue: spyFileService}
      ].concat(mustInjected())
    });
    service = TestBed.inject(ProxyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
