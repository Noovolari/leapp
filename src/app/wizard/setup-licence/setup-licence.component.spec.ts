import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupLicenceComponent } from './setup-licence.component';

describe('SetupLicenceComponent', () => {
  let component: SetupLicenceComponent;
  let fixture: ComponentFixture<SetupLicenceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupLicenceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupLicenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
