import {TestBed} from '@angular/core/testing';

import {SsmService} from './ssm.service';
import {mustInjected} from '../../base-injectables';

describe('SsmService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [].concat(mustInjected())
  }));

  it('should be created', () => {
    const service: SsmService = TestBed.get(SsmService);
    expect(service).toBeTruthy();
  });
});
