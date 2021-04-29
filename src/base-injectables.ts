import {IndividualConfig, ToastrService} from 'ngx-toastr';
import {PositioningService} from 'ngx-bootstrap/positioning';
import {ComponentLoaderFactory} from 'ngx-bootstrap/component-loader';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import 'jasmine';

const toastrService = {
  success: (
    message?: string,
    title?: string,
    override?: Partial<IndividualConfig>
  ) => {},
  error: (
    message?: string,
    title?: string,
    override?: Partial<IndividualConfig>
  ) => {},
};

/* Must inject must be .concat with providers: [] */
const mustInjected = (): any[] => {
  return [PositioningService, ComponentLoaderFactory, BsModalRef, BsModalService, { provide: ToastrService, useValue: toastrService }];
};
export { mustInjected };
