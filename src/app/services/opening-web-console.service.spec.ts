import { TestBed } from '@angular/core/testing';

import { OpeningWebConsoleService } from './opening-web-console.service';

describe('OpeningWebConsoleService', () => {
  let service: OpeningWebConsoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpeningWebConsoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
