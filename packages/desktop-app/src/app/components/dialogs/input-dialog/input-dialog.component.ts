import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BsModalRef } from "ngx-bootstrap/modal";
import { constants } from "@hesketh-racing/leapp-core/models/constants";

@Component({
  selector: "app-input-dialog",
  templateUrl: "./input-dialog.component.html",
  styleUrls: ["./input-dialog.component.scss"],
})
export class InputDialogComponent implements OnInit, AfterViewInit {
  @Input()
  title: string;
  @Input()
  message: string;
  @Input()
  placeholder: string;
  @Input()
  callback: any;
  @Input()
  confirmText: string;
  @Input()
  cancelText: string;
  @ViewChild("inputField")
  inputField: ElementRef;

  public form = new FormGroup({
    value: new FormControl("", [Validators.required]),
  });

  /* Just a restyled modal to show a confirmation for delete actions */
  constructor(private bsModalRef: BsModalRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.inputField.nativeElement.focus();
  }

  /**
   * Launch a callback on yes (which is the actual action), then close
   */
  confirm(): void {
    if (this.callback && this.form.valid) {
      this.callback(this.form.value.value);
      this.bsModalRef.hide();
    }
  }

  close(): void {
    this.callback(constants.confirmClosed);
    this.bsModalRef.hide();
  }

  checkAndConfirm(): void {
    this.confirm();
  }
}
