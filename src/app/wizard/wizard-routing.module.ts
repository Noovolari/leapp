import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DependenciesPageComponent } from './dependencies-page/dependencies-page.component';
import { SetupWelcomeComponent } from './setup-welcome/setup-welcome.component';
import { SetupFirstAccountComponent } from './setup-first-account/setup-first-account.component';
import { SetFederationUrlComponent } from './set-federation-url/set-federation-url.component';
import { SetupSpinnerForLoginComponent } from './setup-spinner-for-login/setup-spinner-for-login.component';
import { WelcomeFirstAccountComponent } from './welcome-first-account/welcome-first-account.component';
import {SetupWorkspaceComponent} from './setup-workspace/setup-workspace.component';
import {SetupLicenceComponent} from './setup-licence/setup-licence.component';

const routes: Routes = [
  {
    path: 'dependencies',
    component: DependenciesPageComponent
  },
  {
    path: 'setup-welcome',
    component: SetupWelcomeComponent
  },
  {
    path: 'setup-licence',
    component: SetupLicenceComponent
  },
  {
    path: 'setup-first-account',
    component: SetupFirstAccountComponent
  },
  {
    path: 'setup-federation-url',
    component: SetFederationUrlComponent
  },
  {
    path: 'setup-spinner-for-login',
    component: SetupSpinnerForLoginComponent
  },
  {
    path: 'welcome-first-account',
    component: WelcomeFirstAccountComponent
  },
  {
    path: 'setup-workspace',
    component: SetupWorkspaceComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WizardRoutingModule { }
