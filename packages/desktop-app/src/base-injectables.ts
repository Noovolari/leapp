import { PositioningService } from "ngx-bootstrap/positioning";
import { ComponentLoaderFactory } from "ngx-bootstrap/component-loader";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import "jasmine";
import { MatSnackBar } from "@angular/material/snack-bar";
import { serialize } from "class-transformer";
import { AppService } from "./app/services/app.service";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { FileService } from "@noovolari/leapp-core/services/file-service";
import { KeychainService } from "@noovolari/leapp-core/services/keychain-service";
import { HttpClient, HttpHandler } from "@angular/common/http";
import { AppNativeService } from "./app/services/app-native.service";
import { AppProviderService } from "./app/services/app-provider.service";
import { MessageToasterService } from "./app/services/message-toaster.service";

export class MockTray {
  constructor() {}
  setToolTip(): void {}
  setContextMenu(): void {}
}

const spyToasterService = jasmine.createSpyObj("ToastrService", ["success", "warning", "error", "info"]);
spyToasterService.success.and.callFake(() => {});
spyToasterService.warning.and.callFake(() => {});
spyToasterService.error.and.callFake(() => {});
spyToasterService.info.and.callFake(() => {});

const spyMatSnackBar = jasmine.createSpyObj("MatSnackBar", ["open"]);
spyMatSnackBar.open.and.callFake(() => {});

const spyAppService = jasmine.createSpyObj("AppService", ["getOS", "isDarkMode", "getMenu", "detectOs", "getApp"]);
spyAppService.getOS.and.returnValue({ homedir: () => "~/testing" });
spyAppService.isDarkMode.and.returnValue(true);
spyAppService.detectOs.and.returnValue("mac");
spyAppService.getApp.and.returnValue({ dock: { setBadge: () => {} } });
spyAppService.getMenu.and.returnValue({ buildFromTemplate: () => true, setApplicationMenu: () => [] });

const spyFileService = jasmine.createSpyObj("FileService", [
  "encryptText",
  "decryptText",
  "writeFileSync",
  "readFileSync",
  "exists",
  "existsSync",
  "newDir",
]);
spyFileService.exists.and.returnValue(true);
spyFileService.existsSync.and.returnValue(true);
spyFileService.newDir.and.returnValue();
spyFileService.encryptText.and.callFake((text: string) => text);
spyFileService.decryptText.and.callFake((text: string) => text);
spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()));

const spyKeychainService = jasmine.createSpyObj("KeychainService", ["getSecret"]);
spyKeychainService.getSecret.and.callFake((_: string, __: string) => "fake-secret");

const spyElectronService = jasmine.createSpyObj("ElectronService", [], {
  os: { homedir: () => "" },
  tray: MockTray,
  fs: { readFileSync: () => "1.0.1" },
  app: { getVersion: () => "1.0.0" },
});

const spyLoggingService = jasmine.createSpyObj("LogService", ["logger"]);
spyLoggingService.logger.and.returnValue(true);

const spyMessageToasterService = jasmine.createSpyObj("MessageToasterService", ["toast"]);
spyMessageToasterService.toast.and.returnValue(true);

const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
  fileService: spyFileService,
  loggingService: spyLoggingService,
});

/* Must inject must be .concat with providers: [] */
const mustInjected = (): any[] => [
  PositioningService,
  ComponentLoaderFactory,
  BsModalRef,
  BsModalService,
  HttpClient,
  HttpHandler,
  { provide: AppService, useValue: spyAppService },
  { provide: FileService, useValue: spyFileService },
  { provide: KeychainService, useValue: spyKeychainService },
  { provide: MatSnackBar, useValue: spyMatSnackBar },
  { provide: AppNativeService, useValue: spyElectronService },
  { provide: AppProviderService, useValue: spyLeappCoreService },
  { provide: MessageToasterService, useValue: spyMessageToasterService },
];
export { mustInjected };
