import {TestBed} from '@angular/core/testing';

import {AwsSsoSessionProviderService} from './aws-sso-session-provider.service';
import {mustInjected} from '../../../base-injectables';

describe('AwsSsoService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [].concat(mustInjected())
  }));

  it('should be created', () => {
    const service: AwsSsoSessionProviderService = TestBed.inject(AwsSsoSessionProviderService);
    expect(service).toBeTruthy();
  });
});
