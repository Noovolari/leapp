import { TestBed } from '@angular/core/testing';

import { GsuiteConnectorService } from './gsuite-connector.service';

describe('GsuiteConnectorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GsuiteConnectorService = TestBed.get(GsuiteConnectorService);
    expect(service).toBeTruthy();
  });
});
