import {TestBed} from '@angular/core/testing';

import {SessionService} from './session.service';
import {mustInjected} from '../../base-injectables';
import {serialize} from 'class-transformer';
import {Workspace} from '../models/workspace';
import {AppService} from './app.service';
import SpyObj = jasmine.SpyObj;
import {WorkspaceService} from './workspace.service';
import {FileService} from './file.service';

describe('SessionService', () => {
  let service: SessionService;

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
        SessionService,
        WorkspaceService,
        {provide: AppService, useValue: spyAppService},
        {provide: FileService, useValue: spyFileService}
      ].concat(mustInjected())
    });
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
