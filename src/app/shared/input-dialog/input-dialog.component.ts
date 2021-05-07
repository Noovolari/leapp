import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Constants} from '../../core/enums/constants';
import {BsModalRef} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-input-dialog',
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss']
})
export class InputDialogComponent implements OnInit {

  @Input()
  title: string;
  @Input()
  message: string;
  @Input()
  placeholder: string;
  @Input()
  callback: any;

  public form = new FormGroup({
    value: new FormControl('', [Validators.required])
  });

  /* Just a restyled modal to show a confirmation for delete actions */
  constructor(private bsModalRef: BsModalRef) { }

  ngOnInit() {
  }

  /**
   * Launch a callback on yes (which is the actual action), then close
   */
  confirm() {
    if (this.callback && this.form.valid) {
      this.callback(this.form.value.value);
      this.bsModalRef.hide();
    }
  }

  close() {
    if (this.callback) {
      this.callback(Constants.confirmClosed);
    }
    this.bsModalRef.hide();
  }

}
