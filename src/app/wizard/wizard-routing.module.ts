import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DependenciesPageComponent } from './dependencies-page/dependencies-page.component';
import { SetupWelcomeComponent } from './setup-welcome/setup-welcome.component';
import { SetupFirstAccountComponent } from './setup-first-account/setup-first-account.component';
import { SetFederationUrlComponent } from './set-federation-url/set-federation-url.component';
import { SetupSpinnerForLoginComponent } from './setup-spinner-for-login/setup-spinner-for-login.component';
import { WelcomeFirstAccountComponent } from './welcome-first-account/welcome-first-account.component';

const routes: Routes = [
  {
    path: 'dependencies',
    component: DependenciesPageComponent // Used to check for evewntual dependencies and anything necessary to make the app running; is also the place where you can put validation checks
  },
  {
    path: 'setup-welcome',
    component: SetupWelcomeComponent // Just a welcome page
  },
  {
    path: 'setup-first-account',
    component: SetupFirstAccountComponent // Setup the first account
  },
  {
    path: 'setup-federation-url',
    component: SetFederationUrlComponent // Page for setting the Federation Url
  },
  {
    path: 'setup-spinner-for-login',
    component: SetupSpinnerForLoginComponent // This page is used when a strategy is doing SSO so a spinner waiting for Google response runs
  },
  {
    path: 'welcome-first-account',
    component: WelcomeFirstAccountComponent // Setup the first account
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WizardRoutingModule { }
