import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WizardRoutingModule} from './wizard-routing.module';
import {DependenciesPageComponent} from './dependencies-page/dependencies-page.component';
import {LayoutModule} from '../layout/layout.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {SetupWelcomeComponent} from './setup-welcome/setup-welcome.component';
import {SetupFirstAccountComponent} from './setup-first-account/setup-first-account.component';
import {SetFederationUrlComponent} from './set-federation-url/set-federation-url.component';
import {SetupSpinnerForLoginComponent} from './setup-spinner-for-login/setup-spinner-for-login.component';
import {WelcomeFirstAccountComponent} from './welcome-first-account/welcome-first-account.component';
import {BsDropdownModule, TooltipModule} from 'ngx-bootstrap';

@NgModule({
  declarations: [
    DependenciesPageComponent,
    SetupWelcomeComponent,
    SetupFirstAccountComponent,
    SetFederationUrlComponent,
    SetupSpinnerForLoginComponent,
    WelcomeFirstAccountComponent],
  imports: [
    CommonModule,
    WizardRoutingModule,
    SharedModule,
    FormsModule,
    LayoutModule,
    NgSelectModule,
    TooltipModule.forRoot(),
    ReactiveFormsModule,
    BsDropdownModule
  ]
})
export class WizardModule { }
