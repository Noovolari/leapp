import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {StartScreenComponent} from './start-screen/start-screen.component';
import {NoAppbarLayoutComponent} from '../layout/noappbar-layout/noappbar-layout.component';


const routes: Routes = [
  {
    path: '',
    component: NoAppbarLayoutComponent,
    children: [
      {
        path: '',
        component: StartScreenComponent // Used to check for eventual dependencies and anything necessary to make the app running; is also the place where you can put validation checks
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StartRoutingModule { }
