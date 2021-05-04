import { TestBed } from '@angular/core/testing';

import { UpdaterService } from './updater.service';

describe('UpdaterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UpdaterService = TestBed.get(UpdaterService);
    expect(service).toBeTruthy();
  });
});
