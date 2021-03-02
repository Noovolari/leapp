import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SessionRoutingModule} from './session-routing.module';
import {SessionComponent} from './session/session.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {BsDropdownModule, TooltipModule} from 'ngx-bootstrap';
import { SessionCardComponent } from './session-card/session-card.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [
    SessionComponent,
    SessionCardComponent
  ],
  imports: [
    CommonModule,
    SessionRoutingModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    TooltipModule.forRoot(),
    BsDropdownModule,
    HttpClientModule
  ]
})
export class SessionModule { }
