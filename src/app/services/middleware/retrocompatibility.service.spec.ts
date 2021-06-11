import { TestBed } from '@angular/core/testing';

import { RetrocompatibilityService } from './retrocompatibility.service';
import {mustInjected} from '../../../base-injectables';

describe('RetrocompatibilityService', () => {
  let service: RetrocompatibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RetrocompatibilityService].concat(mustInjected())
    });
    service = TestBed.inject(RetrocompatibilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
