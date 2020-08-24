import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SessionRoutingModule} from './session-routing.module';
import {SessionComponent} from './session/session.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {CreateAccountComponent} from './create-account/create-account.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {EditTrusterAccountComponent} from './edit-truster-account/edit-truster-account.component';
import {EditAccountComponent} from './edit-account/edit-account.component';
import {BsDropdownModule, TooltipModule} from 'ngx-bootstrap';
import {CreateTrusterAccountComponent} from './create-truster-account/create-truster-account.component';


@NgModule({
  declarations: [
    SessionComponent,
    CreateAccountComponent,
    CreateTrusterAccountComponent,
    EditTrusterAccountComponent,
    EditAccountComponent
  ],
  imports: [
    CommonModule,
    SessionRoutingModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    TooltipModule.forRoot(),
    BsDropdownModule
  ]
})
export class SessionModule { }
