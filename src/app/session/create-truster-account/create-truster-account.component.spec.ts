import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTrusterAccountComponent } from './create-truster-account.component';

describe('CreateTrusterAccountComponent', () => {
  let component: CreateTrusterAccountComponent;
  let fixture: ComponentFixture<CreateTrusterAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateTrusterAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTrusterAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
