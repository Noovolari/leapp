import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ManagingRoutingModule} from './managing-routing.module';
import {LayoutModule} from '../layout/layout.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {CreateAccountComponent} from './create-account/create-account.component';
import { EditAccountComponent } from './edit-account/edit-account.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';

@NgModule({
  declarations: [
    CreateAccountComponent,
    EditAccountComponent
  ],
  imports: [
    CommonModule,
    ManagingRoutingModule,
    SharedModule,
    FormsModule,
    LayoutModule,
    NgSelectModule,
    TooltipModule.forRoot(),
    ReactiveFormsModule,
    BsDropdownModule.forRoot()
  ]
})
export class ManagingModule { }
