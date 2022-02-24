import {PositioningService} from 'ngx-bootstrap/positioning';
import {ComponentLoaderFactory} from 'ngx-bootstrap/component-loader';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import 'jasmine';

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
  BsModalService
];
export { mustInjected};
