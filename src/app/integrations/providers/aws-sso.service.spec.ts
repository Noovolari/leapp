import {TestBed} from '@angular/core/testing';

import {AwsSsoService} from './aws-sso.service';
import {mustInjected} from '../../../base-injectables';

describe('AwsSsoService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [].concat(mustInjected())
  }));

  it('should be created', () => {
    const service: AwsSsoService = TestBed.inject(AwsSsoService);
    expect(service).toBeTruthy();
  });
});
