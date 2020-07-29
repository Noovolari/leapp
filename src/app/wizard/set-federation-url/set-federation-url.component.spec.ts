import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetFederationUrlComponent } from './set-federation-url.component';

describe('SetFederationUrlComponent', () => {
  let component: SetFederationUrlComponent;
  let fixture: ComponentFixture<SetFederationUrlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetFederationUrlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetFederationUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
