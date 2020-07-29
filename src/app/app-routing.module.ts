import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfilePageComponent } from './shared/profile-page/profile-page.component';

const routes: Routes = [
    {
    path: '',
    children: [
      {
        path: 'wizard',
        loadChildren: './wizard/wizard.module#WizardModule'
      },
      {
        path: 'profile',
        component: ProfilePageComponent
      },
      {
        path: 'sessions',
        children: [
          {
            path: '',
            loadChildren: './session/session.module#SessionModule'
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
