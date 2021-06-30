import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {Constants} from '../../../models/constants';
import {BsModalRef} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UpdateDialogComponent implements OnInit {

  @Input()
  version: string;
  @Input()
  releaseDate: string;
  @Input()
  releaseNotes: string;
  @Input()
  callback: any;

  /* Just a restyled modal to show a confirmation for delete actions */
  constructor(private bsModalRef: BsModalRef) { }

  ngOnInit() {}

  close() {
    this.remindMeLater();
  }

  remindMeLater() {
    if (this.callback) {
      this.callback(Constants.confirmClosedAndIgnoreUpdate);
    }
    this.bsModalRef.hide();
  }

  goToDownloadPage() {
    if (this.callback) {
      this.callback(Constants.confirmCloseAndDownloadUpdate);
    }
    this.bsModalRef.hide();
  }
}
