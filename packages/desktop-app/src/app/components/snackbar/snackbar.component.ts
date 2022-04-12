import { Component, Inject, NgZone, OnInit } from "@angular/core";
import { MAT_SNACK_BAR_DATA, MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-snackbar",
  templateUrl: "./snackbar.component.html",
  styleUrls: ["./snackbar.component.scss"],
})
export class SnackbarComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any, private snackBar: MatSnackBar, private ngZone: NgZone) {}

  ngOnInit(): void {}

  close(event: MouseEvent): void {
    this.ngZone.run(() => {
      event.preventDefault();
      this.snackBar.dismiss();
    });
  }
}
