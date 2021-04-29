import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputDialogComponent } from './input-dialog.component';
import {mustInjected} from '../../../base-injectables';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {RouterTestingModule} from '@angular/router/testing';
import {AwsSsoComponent} from '../../integrations/components/aws-sso/aws-sso.component';
import {IntegrationsService} from '../../integrations/integrations.service';
import {KeychainService} from '../../services-system/keychain.service';

describe('InputDialogComponent', () => {
  let component: InputDialogComponent;
  let fixture: ComponentFixture<InputDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [InputDialogComponent],
      providers: [].concat(mustInjected())
    }).compileComponents();

    fixture = TestBed.createComponent(InputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
