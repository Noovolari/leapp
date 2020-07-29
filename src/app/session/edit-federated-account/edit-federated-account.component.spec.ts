import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFederatedAccountComponent } from './edit-federated-account.component';

describe('EditFederatedAccountComponent', () => {
  let component: EditFederatedAccountComponent;
  let fixture: ComponentFixture<EditFederatedAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditFederatedAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFederatedAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
