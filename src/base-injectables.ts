import {IndividualConfig, ToastrService} from 'ngx-toastr';
import {PositioningService} from 'ngx-bootstrap/positioning';
import {ComponentLoaderFactory} from 'ngx-bootstrap/component-loader';
import {BsModalService} from 'ngx-bootstrap/modal';

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

const mustInjected = (): any[] => {
  return [PositioningService, ComponentLoaderFactory, BsModalService, { provide: ToastrService, useValue: toastrService }];
};

export { mustInjected };
