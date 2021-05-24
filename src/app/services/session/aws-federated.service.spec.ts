import { TestBed } from '@angular/core/testing';

import { AwsFederatedService } from './aws-federated.service';
import {mustInjected} from '../../../base-injectables';

describe('AwsFederatedService', () => {
  let service: AwsFederatedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AwsFederatedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
