import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ModalModule, TooltipModule } from 'ngx-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { LayoutModule } from './layout/layout.module';
import { HttpClient, HttpClientModule} from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog/confirmation-dialog.component';
import {SharedModule} from './shared/shared.module';
import {InputDialogComponent} from './shared/input-dialog/input-dialog.component';
import { AwsSsoComponent } from './integrations/components/aws-sso/aws-sso.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {TrayMenuComponent} from './shared/tray-menu/tray-menu.component';
import {UpdateDialogComponent} from "./shared/update-dialog/update-dialog.component";

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    AwsSsoComponent,
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
    ModalModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
  ],
  entryComponents: [ConfirmationDialogComponent, InputDialogComponent, UpdateDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
