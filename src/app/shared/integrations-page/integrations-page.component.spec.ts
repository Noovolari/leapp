import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {IntegrationsPageComponent} from './integrations-page.component';

describe('IntegrationsPageComponent', () => {
  let component: IntegrationsPageComponent;
  let fixture: ComponentFixture<IntegrationsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IntegrationsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
