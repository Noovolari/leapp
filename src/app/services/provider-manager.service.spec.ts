import { TestBed } from '@angular/core/testing';

import { ProviderManagerService } from './provider-manager.service';
import {mustInjected} from '../../base-injectables';
import {RouterTestingModule} from '@angular/router/testing';

describe('ProviderManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    providers: [ProviderManagerService].concat(mustInjected())
  }));

  it('should be created', () => {
    const service: ProviderManagerService = TestBed.inject(ProviderManagerService);
    expect(service).toBeTruthy();
  });
});
