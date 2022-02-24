import { BrowserModule } from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutModule } from './layout/layout.module';
import { HttpClientModule} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDialogComponent } from './components/dialogs/confirmation-dialog/confirmation-dialog.component';
import {InputDialogComponent} from './components/dialogs/input-dialog/input-dialog.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {TrayMenuComponent} from './components/tray-menu/tray-menu.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ModalModule} from 'ngx-bootstrap/modal';
import {ErrorService} from './services/middleware/error.service';

import {MatSnackBarModule} from '@angular/material/snack-bar';
import {ComponentsModule} from './components/components.module';


@NgModule({
    declarations: [
        AppComponent,
        TrayMenuComponent
    ],
    imports: [
        ComponentsModule,
        MatSnackBarModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        LayoutModule,
        TooltipModule.forRoot(),
        ModalModule.forRoot()
    ],
    providers: [{ provide: ErrorHandler, useClass: ErrorService }],
    bootstrap: [AppComponent]
})
export class AppModule { }
