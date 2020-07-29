import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileSidebarComponent } from './profile-sidebar.component';

describe('ProfileSidebarComponent', () => {
  let component: ProfileSidebarComponent;
  let fixture: ComponentFixture<ProfileSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfileSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
