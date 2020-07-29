import {Component, Input, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';

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

  constructor(private bsModalRef: BsModalRef) { }

  ngOnInit() {
  }

  confirm() {
    if (this.callback) {
      this.callback();
      this.close();
    }
  }

  close() {
    this.bsModalRef.hide();
  }

}
