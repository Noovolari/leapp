import {ToastrService} from 'ngx-toastr';
import {PositioningService} from 'ngx-bootstrap/positioning';
import {ComponentLoaderFactory} from 'ngx-bootstrap/component-loader';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import 'jasmine';
import {Workspace} from "./app/models/workspace";
import {AppService} from "./app/services/app.service";
import {FileService} from "./app/services/file.service";
import {serialize} from "class-transformer";

const spyToasterService = jasmine.createSpyObj('ToastrService', ['success', 'warning', 'error', 'info']);
spyToasterService.success.and.callFake(() => {});
spyToasterService.warning.and.callFake(() => {});
spyToasterService.error.and.callFake(() => {});
spyToasterService.info.and.callFake(() => {});

/* Must inject must be .concat with providers: [] */
const mustInjected = (): any[] => [
  PositioningService,
  ComponentLoaderFactory,
  BsModalRef,
  BsModalService,
  { provide: ToastrService, useValue: spyToasterService }
];
export { mustInjected};
