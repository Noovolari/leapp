import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupWelcomeComponent } from './setup-welcome.component';

describe('SetupWelcomeComponent', () => {
  let component: SetupWelcomeComponent;
  let fixture: ComponentFixture<SetupWelcomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupWelcomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupWelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
