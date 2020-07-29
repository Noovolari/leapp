import {TestBed} from '@angular/core/testing';

import {CognitoService} from './cognito.service';

describe('CognitoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CognitoService = TestBed.get(CognitoService);
    expect(service).toBeTruthy();
  });
});
