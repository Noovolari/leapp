import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BsDropdownModule, TabsModule, TooltipModule} from 'ngx-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {RouterModule} from '@angular/router';
import {SessionLayoutComponent} from './session-layout/session-layout.component';
import {SharedModule} from '../shared/shared.module';


@NgModule({
  declarations: [ SessionLayoutComponent ],
  exports: [],
  imports: [
    CommonModule,
    TabsModule.forRoot(),
    TranslateModule,
    BsDropdownModule.forRoot(),
    RouterModule,
    TooltipModule,
    SharedModule
  ]
})
export class LayoutModule { }
