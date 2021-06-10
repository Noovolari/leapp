import { TestBed } from '@angular/core/testing';

import { UpdaterService } from './updater.service';

describe('UpdaterService', () => {
  let service: UpdaterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdaterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
