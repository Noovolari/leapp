import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LocalizationService } from "../localization/localization.service";

const snackBarConfig = { duration: 15000 };

@Injectable({ providedIn: "root" })
export class SnackbarErrorService {
  constructor(private readonly localizationService: LocalizationService, private readonly snackBar: MatSnackBar) {}

  showError(errorCode: string | number): void {
    const errorMessage = this.localizationService.localize([`error.${errorCode}`, "error.UnknownError"]);
    this.snackBar.open(errorMessage, this.localizationService.localize("Ok"), snackBarConfig);
  }

  showMessage(message: string): void {
    this.snackBar.open(message, this.localizationService.localize("Ok"), snackBarConfig);
  }
}
