import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfilePageComponent } from './shared/profile-page/profile-page.component';

const routes: Routes = [
    {
    path: '',
    children: [
      {
        path: 'wizard',
        loadChildren: './wizard/wizard.module#WizardModule' // contains all the components that defines the initial setup
      },
      {
        path: 'profile',
        component: ProfilePageComponent // The profile page
      },
      {
        path: 'sessions',
        children: [
          {
            path: '',
            loadChildren: './session/session.module#SessionModule' // Starting component for all sessions related, when the app is up and running
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
