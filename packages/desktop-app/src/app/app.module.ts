import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LayoutModule } from "./layout/layout.module";
import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { TrayMenuComponent } from "./components/tray-menu/tray-menu.component";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { ModalModule } from "ngx-bootstrap/modal";
import { ErrorService } from "./services/middleware/error.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { ComponentsModule } from "./components/components.module";
import { ToastrModule } from "ngx-toastr";

@NgModule({
  declarations: [AppComponent, TrayMenuComponent],
  bootstrap: [AppComponent],
  imports: [
    ComponentsModule,
    MatSnackBarModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    LayoutModule,
    TooltipModule,
    ModalModule,
    ToastrModule.forRoot(),
  ],
  providers: [{ provide: ErrorHandler, useClass: ErrorService }, provideHttpClient(withXhr(), withInterceptorsFromDi())],
})
export class AppModule {}
