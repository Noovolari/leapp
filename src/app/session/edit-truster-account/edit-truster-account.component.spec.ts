import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrusterAccountComponent } from './edit-truster-account.component';

describe('EditTrusterAccountComponent', () => {
  let component: EditTrusterAccountComponent;
  let fixture: ComponentFixture<EditTrusterAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditTrusterAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTrusterAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
