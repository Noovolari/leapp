import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationPageComponent } from './integration-page.component';

describe('IntegrationPageComponent', () => {
  let component: IntegrationPageComponent;
  let fixture: ComponentFixture<IntegrationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntegrationPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
