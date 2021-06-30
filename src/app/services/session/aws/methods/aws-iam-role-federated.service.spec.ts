import { TestBed } from '@angular/core/testing';

import { AwsIamRoleFederatedService } from './aws-iam-role-federated.service';
import {mustInjected} from '../../../../../base-injectables';

describe('AwsIamRoleFederatedService', () => {
  let service: AwsIamRoleFederatedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AwsIamRoleFederatedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
