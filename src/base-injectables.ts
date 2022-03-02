import {PositioningService} from 'ngx-bootstrap/positioning';
import {ComponentLoaderFactory} from 'ngx-bootstrap/component-loader';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import 'jasmine';
import {MatSnackBar} from "@angular/material/snack-bar";
import {serialize} from "class-transformer";
import {Workspace} from "./app/models/workspace";
import {AppService} from "./app/services/app.service";
import {FileService} from "./app/services/file.service";
import {KeychainService} from "./app/services/keychain.service";

const spyToasterService = jasmine.createSpyObj('ToastrService', ['success', 'warning', 'error', 'info']);
spyToasterService.success.and.callFake(() => {});
spyToasterService.warning.and.callFake(() => {});
spyToasterService.error.and.callFake(() => {});
spyToasterService.info.and.callFake(() => {});

const spyMatSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
spyMatSnackBar.open.and.callFake(() => {});

const spyAppService = jasmine.createSpyObj('AppService', ['getOS', 'isDarkMode']);
spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });
spyAppService.isDarkMode.and.returnValue(true);

const spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
spyFileService.exists.and.returnValue(true);
spyFileService.newDir.and.returnValue();
spyFileService.encryptText.and.callFake((text: string) => text);
spyFileService.decryptText.and.callFake((text: string) => text);
spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );

const spyKeychainService = jasmine.createSpyObj('KeychainService' , ['getSecret']);
spyKeychainService.getSecret.and.callFake((_: string, __: string) => 'fake-secret');

/* Must inject must be .concat with providers: [] */
const mustInjected = (): any[] => [
  PositioningService,
  ComponentLoaderFactory,
  BsModalRef,
  BsModalService,
  { provide: AppService, useValue: spyAppService },
  { provide: FileService, useValue: spyFileService },
  { provide: KeychainService, useValue: spyKeychainService },
  { provide: MatSnackBar, useValue: spyMatSnackBar }
];
export { mustInjected };
