import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SessionLayoutComponent } from '../layout/session-layout/session-layout.component';
import { SessionComponent } from './session/session.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { EditAccountComponent } from './edit-account/edit-account.component';
import {NoAppbarLayoutComponent} from '../layout/noappbar-layout/noappbar-layout.component';

const routes: Routes = [
  {
    path: '',
    component: NoAppbarLayoutComponent, // Used as a layout for the sessions
    children: [
      {
        path: 'create-account',
        component: CreateAccountComponent
      },
      {
        path: 'edit-account',
        component: EditAccountComponent
      },
      {
        path: '',
        component: SessionLayoutComponent,
        children: [
          {
            path: 'session-selected',
            component: SessionComponent // the actual screen where you manage the session credentials
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SessionRoutingModule { }
