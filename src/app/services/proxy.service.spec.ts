import {TestBed} from '@angular/core/testing';

import {ProxyService} from './proxy.service';

describe('ProxyService', () => {
  let service: ProxyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProxyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
