import {Component, Input, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Constants} from '../../../models/constants';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {

  @Input()
  message: string;
  @Input()
  callback: any;

  /* Just a restyled modal to show a confirmation for delete actions */
  constructor(private bsModalRef: BsModalRef) { }

  ngOnInit() {
  }

  /**
   * Launch a callback on yes (which is the actual action), then close
   */
  confirm() {
    if (this.callback) {
      this.callback(Constants.confirmed);
      this.close();
    }
  }

  close() {
    this.bsModalRef.hide();
    this.callback(Constants.confirmClosed);
  }

}
