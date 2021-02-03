import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProfileComponent} from './profile/profile.component';
import {BsDropdownModule, ModalModule, TooltipModule} from 'ngx-bootstrap';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {ProfileSidebarComponent} from './profile-sidebar/profile-sidebar.component';
import {ProfilePageComponent} from './profile-page/profile-page.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgxJsonViewerModule} from 'ngx-json-viewer';
import {InputDialogComponent} from './input-dialog/input-dialog.component';
import {IntegrationsPageComponent} from './integrations-page/integrations-page.component';
import {NgSelectModule} from '@ng-select/ng-select';


@NgModule({
  declarations: [ProfileComponent, ConfirmationDialogComponent, ProfileSidebarComponent, ProfilePageComponent, InputDialogComponent, IntegrationsPageComponent],
    imports: [CommonModule, TooltipModule.forRoot(), BsDropdownModule.forRoot(), ModalModule.forRoot(), ReactiveFormsModule, FormsModule, NgxJsonViewerModule, NgSelectModule],
  exports: [ProfileComponent, ConfirmationDialogComponent, ProfileSidebarComponent, InputDialogComponent]
})
export class SharedModule { }
