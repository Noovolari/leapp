import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DependenciesPageComponent } from './dependencies-page.component';

describe('DependenciesPageComponent', () => {
  let component: DependenciesPageComponent;
  let fixture: ComponentFixture<DependenciesPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DependenciesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DependenciesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
