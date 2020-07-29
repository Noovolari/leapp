import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceBarComponent } from './workspace-bar.component';

describe('WorkspaceBarComponent', () => {
  let component: WorkspaceBarComponent;
  let fixture: ComponentFixture<WorkspaceBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkspaceBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
