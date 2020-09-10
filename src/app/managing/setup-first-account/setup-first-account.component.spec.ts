import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupFirstAccountComponent } from './setup-first-account.component';

describe('SetupFirstAccountComponent', () => {
  let component: SetupFirstAccountComponent;
  let fixture: ComponentFixture<SetupFirstAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupFirstAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupFirstAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
