import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeFirstAccountComponent } from './welcome-first-account.component';

describe('WelcomeFirstAccountComponent', () => {
  let component: WelcomeFirstAccountComponent;
  let fixture: ComponentFixture<WelcomeFirstAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WelcomeFirstAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeFirstAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
