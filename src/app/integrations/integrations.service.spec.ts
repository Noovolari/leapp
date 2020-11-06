import {TestBed} from '@angular/core/testing';

import {IntegrationsService} from './integrations.service';

describe('IntegrationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: IntegrationsService = TestBed.get(IntegrationsService);
    expect(service).toBeTruthy();
  });
});
