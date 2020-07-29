import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BsDropdownModule, TabsModule, TooltipModule} from 'ngx-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {RouterModule} from '@angular/router';
import { WorkspaceBarComponent } from './workspace-bar/workspace-bar.component';

@NgModule({
  declarations: [ WorkspaceBarComponent ],
  exports: [],
  imports: [
    CommonModule,
    TabsModule.forRoot(),
    TranslateModule,
    BsDropdownModule.forRoot(),
    RouterModule,
    TooltipModule
  ]
})
export class LayoutModule { }
