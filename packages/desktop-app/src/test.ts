// This file is required by karma.conf.js
import "zone.js/testing";
import { getTestBed } from "@angular/core/testing";
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from "@angular/platform-browser-dynamic/testing";

// Initialize the Angular testing environment; the spec files come from "include" in angular.json
// (require.context is not supported by the Angular test builder since Angular 15)
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
