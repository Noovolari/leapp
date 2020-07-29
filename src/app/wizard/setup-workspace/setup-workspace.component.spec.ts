import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupWorkspaceComponent } from './setup-workspace.component';

describe('SetupWorkspaceComponent', () => {
  let component: SetupWorkspaceComponent;
  let fixture: ComponentFixture<SetupWorkspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupWorkspaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
