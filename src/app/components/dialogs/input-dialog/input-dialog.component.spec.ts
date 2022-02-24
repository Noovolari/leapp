import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InputDialogComponent} from './input-dialog.component';
import {mustInjected} from '../../../../base-injectables';
import {RouterTestingModule} from '@angular/router/testing';

describe('InputDialogComponent', () => {
  let component: InputDialogComponent;
  let fixture: ComponentFixture<InputDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [InputDialogComponent],
      providers: [].concat(mustInjected())
    }).compileComponents();

    fixture = TestBed.createComponent(InputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
