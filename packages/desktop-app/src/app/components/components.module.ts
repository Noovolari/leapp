import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgSelectModule } from "@ng-select/ng-select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ConfirmationDialogComponent } from "./dialogs/confirmation-dialog/confirmation-dialog.component";
import { InputDialogComponent } from "./dialogs/input-dialog/input-dialog.component";
import { SnackbarComponent } from "./snackbar/snackbar.component";
import { UpdateDialogComponent } from "./dialogs/update-dialog/update-dialog.component";
import { ModalModule } from "ngx-bootstrap/modal";
import { NgxJsonViewerModule } from "ngx-json-viewer";
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { SessionsComponent } from "./sessions/sessions.component";
import { SessionCardComponent } from "./sessions/session-card/session-card.component";
import { FilteringPipe } from "./sessions/pipes/filtering.pipe";
import { OrderingPipe } from "./sessions/pipes/ordering.pipe";
import { QueryingPipe } from "./sessions/pipes/querying.pipe";
import { DetailPipe } from "./sessions/pipes/detail.pipe";
import { CommandBarComponent } from "./command-bar/command-bar.component";
import { SideBarComponent } from "./side-bar/side-bar.component";
import { OptionsDialogComponent } from "./dialogs/options-dialog/options-dialog.component";
import { CreateDialogComponent } from "./dialogs/create-dialog/create-dialog.component";
import { EditDialogComponent } from "./dialogs/edit-dialog/edit-dialog.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatListModule } from "@angular/material/list";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { FilterMenuComponent } from "./filter-menu/filter-menu.component";
import { SegmentDialogComponent } from "./dialogs/segment-dialog/segment-dialog.component";
import { ColumnDialogComponent } from "./dialogs/column-dialog/column-dialog.component";
import { LeappSelectComponent } from "./leapp-select/leapp-select.component";
import { IntegrationBarComponent } from "./integration-bar/integration-bar.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CredentialProcessDialogComponent } from "./dialogs/credential-process-dialog/credential-process-dialog.component";

@NgModule({
  declarations: [
    SessionsComponent,
    SessionCardComponent,
    FilteringPipe,
    OrderingPipe,
    QueryingPipe,
    DetailPipe,
    ConfirmationDialogComponent,
    InputDialogComponent,
    UpdateDialogComponent,
    SnackbarComponent,
    CommandBarComponent,
    SideBarComponent,
    OptionsDialogComponent,
    CreateDialogComponent,
    EditDialogComponent,
    FilterMenuComponent,
    SegmentDialogComponent,
    ColumnDialogComponent,
    LeappSelectComponent,
    IntegrationBarComponent,
    CredentialProcessDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    TooltipModule.forRoot(),
    ReactiveFormsModule,
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    NgxJsonViewerModule,
    MatTabsModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatTooltipModule,
  ],
  exports: [ConfirmationDialogComponent, InputDialogComponent, CommandBarComponent, SideBarComponent, SessionsComponent],
})
export class ComponentsModule {}
