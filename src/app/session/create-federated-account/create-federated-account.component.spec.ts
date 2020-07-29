import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFederatedAccountComponent } from './create-federated-account.component';

describe('CreateFederatedAccountComponent', () => {
  let component: CreateFederatedAccountComponent;
  let fixture: ComponentFixture<CreateFederatedAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateFederatedAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFederatedAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
