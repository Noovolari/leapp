import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionChooseComponent } from './session-choose.component';

describe('SessionChooseComponent', () => {
  let component: SessionChooseComponent;
  let fixture: ComponentFixture<SessionChooseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SessionChooseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
