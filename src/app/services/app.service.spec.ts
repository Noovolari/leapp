import { TestBed } from '@angular/core/testing';

import { AppService } from './app.service';
import {mustInjected} from '../../base-injectables';

describe('AppService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [AppService].concat(mustInjected())
  }));

  it('should be created', () => {
    const service: AppService = TestBed.inject(AppService);
    expect(service).toBeTruthy();
  });
});
