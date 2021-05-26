import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AwsSsoComponent} from './aws-sso.component';
import {mustInjected} from '../../../base-injectables';
import {IntegrationsService} from '../../integrations/integrations.service';
import {RouterTestingModule} from '@angular/router/testing';
import {KeychainService} from '../../services/keychain.service';

describe('AwsSsoComponent', () => {
  let component: AwsSsoComponent;
  let fixture: ComponentFixture<AwsSsoComponent>;

  const secretManager = [];
  const spyKeychainService = jasmine.createSpyObj('KeychainService', ['saveSecret', 'getSecret', 'deletePassword']);
  spyKeychainService.saveSecret.and.returnValue((service: string, account: string, password: string) => {
    secretManager[`${service}-${account}`] = password;
  });
  spyKeychainService.getSecret.and.returnValue((service: string, account: string) => secretManager[`${service}-${account}`]);
  spyKeychainService.deletePassword.and.returnValue((service: string, account: string) => {
 delete secretManager[`${service}-${account}`];
});

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AwsSsoComponent],
      providers: [IntegrationsService, { provide: KeychainService, useValue: spyKeychainService }].concat(mustInjected())
    }).compileComponents();

    fixture = TestBed.createComponent(AwsSsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
