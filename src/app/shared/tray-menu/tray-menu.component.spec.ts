import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrayMenuComponent } from './tray-menu.component';

describe('TrayMenuComponent', () => {
  let component: TrayMenuComponent;
  let fixture: ComponentFixture<TrayMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrayMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrayMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
