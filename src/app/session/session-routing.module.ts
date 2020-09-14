import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SessionLayoutComponent } from '../layout/session-layout/session-layout.component';
import { SessionComponent } from './session/session.component';

const routes: Routes = [
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SessionRoutingModule { }
