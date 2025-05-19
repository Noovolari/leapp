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
//import { MatTabsModule } from "@angular/material/tabs";
import { MatLegacyTabsModule } from "@angular/material/legacy-tabs";
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
//import { MatMenuModule } from "@angular/material/menu";
import { MatLegacyMenuModule } from "@angular/material/legacy-menu";
//import { MatListModule } from "@angular/material/list";
import { MatLegacyListModule } from "@angular/material/legacy-list";
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
import { ChangeRegionDialogComponent } from "./dialogs/change-region-dialog/change-region-dialog.component";
import { ChangeNamedProfileDialogComponent } from "./dialogs/change-named-profile-dialog/change-named-profile-dialog.component";
import { SsmModalDialogComponent } from "./dialogs/ssm-modal-dialog/ssm-modal-dialog.component";
import { ContextualMenuComponent } from "./contextual-menu/contextual-menu.component";
import { BottomBarComponent } from "./bottom-bar/bottom-bar.component";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { LoginWorkspaceDialogComponent } from "./dialogs/login-team-dialog/login-workspace-dialog.component";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ManageTeamWorkspacesDialogComponent } from "./dialogs/manage-team-workspaces-dialog/manage-team-workspaces-dialog.component";
import { InfoDialogComponent } from "./dialogs/info-dialog/info-dialog.component";
import { LeappProPreCheckoutDialogComponent } from "./dialogs/leapp-pro-pre-checkout-dialog/leapp-pro-pre-checkout-dialog.component";
import { SyncProWidgetComponent } from "./sync-pro-widget/sync-pro-widget.component";
import { OverlayModule } from "@angular/cdk/overlay";
import { LockPageComponent } from "./lock-page/lock-page.component";
import { CheckIconSvgComponent } from "./check-icon-svg/check-icon-svg.component";
import { AuthorizationDialogComponent } from "./dialogs/authorization-dialog/authorization-dialog.component";
import { NoovolariDialogComponent } from "./dialogs/noovolari-dialog/noovolari-dialog.component";

@NgModule({
  declarations: [
    SessionsComponent,
    SessionCardComponent,
    FilteringPipe,
    OrderingPipe,
    QueryingPipe,
    DetailPipe,
    ConfirmationDialogComponent,
    AuthorizationDialogComponent,
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
    ChangeRegionDialogComponent,
    ChangeNamedProfileDialogComponent,
    SsmModalDialogComponent,
    ContextualMenuComponent,
    BottomBarComponent,
    InfoDialogComponent,
    LoginWorkspaceDialogComponent,
    ManageTeamWorkspacesDialogComponent,
    LeappProPreCheckoutDialogComponent,
    SyncProWidgetComponent,
    LockPageComponent,
    CheckIconSvgComponent,
    NoovolariDialogComponent,
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
    //MatTabsModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    //MatMenuModule,
    //MatListModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatTooltipModule,
    ScrollingModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgSelectModule,
    OverlayModule,
    MatLegacyListModule,
    MatLegacyMenuModule,
    MatLegacyTabsModule,
  ],
  exports: [
    ConfirmationDialogComponent,
    AuthorizationDialogComponent,
    InputDialogComponent,
    CommandBarComponent,
    SideBarComponent,
    SessionsComponent,
  ],
})
export class ComponentsModule {}
