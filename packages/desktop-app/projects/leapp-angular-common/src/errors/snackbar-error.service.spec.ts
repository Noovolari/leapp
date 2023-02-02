import { TestBed } from "@angular/core/testing";

import { SnackbarErrorService } from "./snackbar-error.service";
import { LocalizationService } from "../localization/localization.service";
import { MatSnackBar } from "@angular/material/snack-bar";

describe("ApiErrorDisplayService", () => {
  const localizationServiceMock: any = {};
  const snackBarMock: any = {};
  let snackbarErrorService: SnackbarErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({})
      .overrideProvider(LocalizationService, { useValue: localizationServiceMock })
      .overrideProvider(MatSnackBar, { useValue: snackBarMock });

    snackbarErrorService = TestBed.inject(SnackbarErrorService);
  });

  it("ShowError", () => {
    localizationServiceMock.localize = (str: string) => str;

    let snackbarErrorMessage = "";
    let strOkMessage = "";
    snackBarMock.open = (errorMessage: string, strOk: string) => {
      snackbarErrorMessage = errorMessage;
      strOkMessage = strOk;
    };

    snackbarErrorService.showError("error-code-007");
    expect(snackbarErrorMessage).toEqual(["error.error-code-007", "error.UnknownError"]);
    expect(strOkMessage).toEqual("Ok");
  });

  it("ShowMessage", () => {
    const localizationService = {
      localize: () => "mock-return-value",
    } as any;
    const snackbar = {
      open: () => {},
    } as any;
    spyOn(localizationService, "localize").and.callThrough();
    spyOn(snackbar, "open").and.callThrough();
    const snackbarService = new SnackbarErrorService(localizationService, snackbar);
    snackbarService.showMessage("mock-message");
    expect(localizationService.localize).toHaveBeenCalledWith("Ok");
    expect(snackbar.open).toHaveBeenCalledWith("mock-message", "mock-return-value", { duration: 15000 });
  });
});
