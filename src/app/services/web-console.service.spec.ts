import { TestBed } from '@angular/core/testing';

import { WebConsoleService } from './web-console.service';

describe('WebConsoleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebConsoleService = TestBed.get(WebConsoleService);
    expect(service).toBeTruthy();
  });
});
