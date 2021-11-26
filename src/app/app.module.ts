import { BrowserModule } from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';
import { LayoutModule } from './layout/layout.module';
import { HttpClientModule} from '@angular/common/http';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDialogComponent } from './components/shared/confirmation-dialog/confirmation-dialog.component';
import {SharedModule} from './components/shared/shared.module';
import {InputDialogComponent} from './components/shared/input-dialog/input-dialog.component';
import {IntegrationComponent} from './components/integration/integration.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {TrayMenuComponent} from './components/shared/tray-menu/tray-menu.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ModalModule} from 'ngx-bootstrap/modal';
import {ErrorService} from './services/middleware/error.service';

@NgModule({
  declarations: [
    AppComponent,
    IntegrationComponent,
    TrayMenuComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    LayoutModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-full-width'
    }),
    TooltipModule.forRoot(),
    ModalModule.forRoot()
  ],
  entryComponents: [ConfirmationDialogComponent, InputDialogComponent],
  providers: [{ provide: ErrorHandler, useClass: ErrorService}],
  bootstrap: [AppComponent]
})
export class AppModule { }
