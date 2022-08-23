import { Component, Inject, NgZone, OnInit } from "@angular/core";
import { MAT_SNACK_BAR_DATA, MatSnackBar } from "@angular/material/snack-bar";
import { AppProviderService } from "../../services/app-provider.service";

@Component({
  selector: "app-snackbar",
  templateUrl: "./snackbar.component.html",
  styleUrls: ["./snackbar.component.scss"],
})
export class SnackbarComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(
    @Inject(AppProviderService) private appProviderService: AppProviderService,
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {}

  close(event: MouseEvent): void {
    this.ngZone.run(() => {
      event.preventDefault();
      this.snackBar.dismiss();
    });
  }

  processEventualLink() {
    if (this.data.link) {
      this.appProviderService.windowService.openExternalUrl(this.data.link);
    }
  }
}
