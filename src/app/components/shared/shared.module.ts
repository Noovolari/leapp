import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProfileComponent} from './profile/profile.component';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {ProfileSidebarComponent} from './profile-sidebar/profile-sidebar.component';
import {ProfilePageComponent} from './profile-page/profile-page.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgxJsonViewerModule} from 'ngx-json-viewer';
import {InputDialogComponent} from './input-dialog/input-dialog.component';
import {IntegrationsPageComponent} from './integrations-page/integrations-page.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import { UpdateDialogComponent } from './update-dialog/update-dialog.component';
import {MatTabsModule} from "@angular/material/tabs";
import {MatIconModule} from "@angular/material/icon";
import {MatCheckboxModule} from "@angular/material/checkbox";

@NgModule({
  declarations: [ProfileComponent, ConfirmationDialogComponent, ProfileSidebarComponent, ProfilePageComponent, InputDialogComponent, UpdateDialogComponent],
    imports: [CommonModule, TooltipModule.forRoot(), BsDropdownModule.forRoot(), ModalModule.forRoot(), ReactiveFormsModule, FormsModule, NgxJsonViewerModule, NgSelectModule, MatTabsModule, MatIconModule, MatCheckboxModule],
  exports: [ProfileComponent, ConfirmationDialogComponent, ProfileSidebarComponent, InputDialogComponent]
})
export class SharedModule { }
