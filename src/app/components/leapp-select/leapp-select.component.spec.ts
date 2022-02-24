import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeappSelectComponent } from './leapp-select.component';

describe('LeappSelectComponent', () => {
  let component: LeappSelectComponent;
  let fixture: ComponentFixture<LeappSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeappSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeappSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
