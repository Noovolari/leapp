import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {NoAppbarLayoutComponent} from '../layout/noappbar-layout/noappbar-layout.component';
import {CreateAccountComponent} from './create-account/create-account.component';

const routes: Routes = [
  {
    path: '',
    component: NoAppbarLayoutComponent, // Used as a layout for the sessions
    children: [
      {
        path: 'create-account',
        component: CreateAccountComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagingRoutingModule { }
