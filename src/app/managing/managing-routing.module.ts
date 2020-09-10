import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartScreenComponent } from './start-screen/start-screen.component';
import { SetupFirstAccountComponent } from './setup-first-account/setup-first-account.component';
import {NoAppbarLayoutComponent} from '../layout/noappbar-layout/noappbar-layout.component';
import {CreateAccountComponent} from './create-account/create-account.component';
import {EditAccountComponent} from './edit-account/edit-account.component';

const routes: Routes = [
  {
    path: '',
    component: NoAppbarLayoutComponent, // Used as a layout for the sessions
    children: [
      {
        path: 'start-screen',
        component: StartScreenComponent // Used to check for eventual dependencies and anything necessary to make the app running; is also the place where you can put validation checks
      },
      {
        path: 'setup-first-account',
        component: SetupFirstAccountComponent // Setup the first account
      },
      {
        path: 'create-account',
        component: CreateAccountComponent
      },
      {
        path: 'edit-account',
        component: EditAccountComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagingRoutingModule { }
