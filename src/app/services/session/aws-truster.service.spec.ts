import { TestBed } from '@angular/core/testing';

import { AwsTrusterService } from './aws-truster.service';
import {mustInjected} from '../../../base-injectables';

describe('AwsTrusterService', () => {
  let service: AwsTrusterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AwsTrusterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
