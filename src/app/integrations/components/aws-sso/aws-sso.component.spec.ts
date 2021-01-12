import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsSsoComponent } from './aws-sso.component';

describe('AwsSsoComponent', () => {
  let component: AwsSsoComponent;
  let fixture: ComponentFixture<AwsSsoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AwsSsoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsSsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
