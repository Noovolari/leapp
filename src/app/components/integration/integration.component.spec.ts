import {ComponentFixture, TestBed} from '@angular/core/testing';

import {IntegrationComponent} from './integration.component';
import {mustInjected} from '../../../base-injectables';
import {RouterTestingModule} from '@angular/router/testing';
import {KeychainService} from '../../services/keychain.service';

describe('AwsSsoComponent', () => {
  let component: IntegrationComponent;
  let fixture: ComponentFixture<IntegrationComponent>;

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
      declarations: [IntegrationComponent],
      providers: [{ provide: KeychainService, useValue: spyKeychainService }].concat(mustInjected())
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
