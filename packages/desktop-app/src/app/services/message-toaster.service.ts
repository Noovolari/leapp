import { Injectable } from "@angular/core";
import { SnackbarComponent } from "../components/snackbar/snackbar.component";
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from "@angular/material/snack-bar";

export enum ToastLevel {
  info,
  warn,
  error,
  success,
}

@Injectable({ providedIn: "root" })
export class MessageToasterService {
  horizontalPosition: MatSnackBarHorizontalPosition = "left";
  verticalPosition: MatSnackBarVerticalPosition = "bottom";
  snackbarRef;

  constructor(private matSnackBar: MatSnackBar) {}

  /**
   * Show a toast message with different styles for different type of toast
   *
   * @param message - the message to show
   * @param type - the type of message from Toast Level
   * @param title - [optional]
   * @param link - [optional]
   */
  toast(message: string, type: ToastLevel, title?: string, link?: string, duration?: number): void {
    switch (type) {
      case ToastLevel.success:
        this.openSnackBar(message, title, "toast-success", undefined, duration);
        break;
      case ToastLevel.info:
        this.openSnackBar(message, title, "toast-info", link, duration);
        break;
      case ToastLevel.warn:
        this.openSnackBar(message, title, "toast-warning", undefined, duration);
        break;
      // eslint-disable-next-line max-len
      case ToastLevel.error:
        this.openSnackBar(message, title ? title : "Invalid Action!", "toast-error", link);
        break;
      default:
        this.openSnackBar(message, title, "toast-error");
        break;
    }
  }

  private openSnackBar(message: string, _: string, className: string, link?: string, duration?: number) {
    if (this.snackbarRef) {
      this.snackbarRef.dismiss();
    }

    const defaultDuration = className === "toast-error" ? 0 : 3000;
    this.snackbarRef = this.matSnackBar.openFromComponent(SnackbarComponent, {
      data: { html: message, className, link },
      duration: duration ?? defaultDuration,
      panelClass: [className],
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }
}
