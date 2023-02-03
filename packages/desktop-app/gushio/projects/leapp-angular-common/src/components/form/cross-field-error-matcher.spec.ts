import { TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { CrossFieldErrorMatcher } from "./cross-field-error-matcher";

describe("Cross Field Error Matcher", () => {
  let passwdControl: FormControl;

  beforeEach(() => {
    passwdControl = {
      dirty: false,
      errors: null,
      touched: false,
      parent: {
        errors: null,
      },
    } as FormControl;
    TestBed.configureTestingModule({});
  });

  it("isErrorState - ok", () => {
    const errorMatcher = new CrossFieldErrorMatcher();
    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeFalsy();
  });

  it("isErrorState - errors in control, touched yes", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).errors = "Fake Error";
    (passwdControl as any).touched = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeTruthy();
  });

  it("isErrorState - errors in control, dirty yes", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).errors = "Fake Error";
    (passwdControl as any).dirty = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeTruthy();
  });

  it("isErrorState - errors parent in control, dirty yes", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).parent.errors = "Fake Error";
    (passwdControl as any).dirty = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeTruthy();
  });

  it("isErrorState - errors parent in control, touched yes", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).parent.errors = "Fake Error";
    (passwdControl as any).touched = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeTruthy();
  });

  it("isErrorState - parent is null", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).parent = null;
    (passwdControl as any).touched = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeTruthy();
  });

  it("isErrorState - errors is null", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).errors = null;
    (passwdControl as any).touched = false;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeFalsy();
  });

  it("isErrorState - errors is null, touched true", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).errors = null;
    (passwdControl as any).touched = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeFalsy();
  });

  it("isErrorState - parent is null, touched true", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).parent = null;
    (passwdControl as any).touched = true;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeTruthy();
  });

  it("isErrorState - parent errors is null", () => {
    const errorMatcher = new CrossFieldErrorMatcher();

    (passwdControl as any).parent.errors = null;
    (passwdControl as any).dirty = null;
    (passwdControl as any).touched = null;

    const isError = errorMatcher.isErrorState(passwdControl, null);
    expect(isError).toBeFalsy();
  });
});
