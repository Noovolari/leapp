import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './profile/profile.component';
import { TooltipModule, BsDropdownModule, ModalModule } from 'ngx-bootstrap';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { ProfileSidebarComponent } from './profile-sidebar/profile-sidebar.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NgxJsonViewerModule} from 'ngx-json-viewer';
import { InputDialogComponent } from './input-dialog/input-dialog.component';



@NgModule({
  declarations: [ProfileComponent, ConfirmationDialogComponent, ProfileSidebarComponent, ProfilePageComponent, InputDialogComponent],
  imports: [CommonModule, TooltipModule.forRoot(), BsDropdownModule.forRoot(), ModalModule.forRoot(), ReactiveFormsModule, FormsModule, NgxJsonViewerModule],
  exports: [ProfileComponent, ConfirmationDialogComponent, ProfileSidebarComponent, InputDialogComponent]
})
export class SharedModule { }
