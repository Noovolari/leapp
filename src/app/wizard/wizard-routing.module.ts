import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartScreenComponent } from './start-screen/start-screen.component';
import { SetupFirstAccountComponent } from './setup-first-account/setup-first-account.component';

const routes: Routes = [
  {
    path: 'start-screen',
    component: StartScreenComponent // Used to check for eventual dependencies and anything necessary to make the app running; is also the place where you can put validation checks
  },
  {
    path: 'setup-first-account',
    component: SetupFirstAccountComponent // Setup the first account
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WizardRoutingModule { }
