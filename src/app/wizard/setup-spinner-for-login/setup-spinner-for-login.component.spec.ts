import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupSpinnerForLoginComponent } from './setup-spinner-for-login.component';

describe('SetupSpinnerForLoginComponent', () => {
  let component: SetupSpinnerForLoginComponent;
  let fixture: ComponentFixture<SetupSpinnerForLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupSpinnerForLoginComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupSpinnerForLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
