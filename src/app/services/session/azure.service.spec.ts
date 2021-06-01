import { TestBed } from '@angular/core/testing';

import { AzureService } from './azure.service';
import {mustInjected} from "../../../base-injectables";

describe('AzureService', () => {
  let service: AzureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AzureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
