import { TestBed } from '@angular/core/testing';

import { MessageBrokerService } from './message-broker.service';

describe('MessageBrokerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MessageBrokerService = TestBed.get(MessageBrokerService);
    expect(service).toBeTruthy();
  });
});
