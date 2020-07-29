import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionWalletComponent } from './session-wallet.component';

describe('SessionWalletComponent', () => {
  let component: SessionWalletComponent;
  let fixture: ComponentFixture<SessionWalletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SessionWalletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
