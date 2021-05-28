import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ProfilePageComponent} from './components/shared/profile-page/profile-page.component';
import {IntegrationsPageComponent} from './components/shared/integrations-page/integrations-page.component';
import {AwsSsoComponent} from './components/aws-sso/aws-sso.component';

const routes: Routes = [
    {
    path: '',
    children: [
      {
        path: 'start',
        loadChildren: './components/components.module#ComponentsModule' // contains all the components that defines the initial setup
      },
      {
        path: 'managing',
        loadChildren: './components/components.module#ComponentsModule' // contains all the components that defines the initial setup
      },
      {
        path: 'profile',
        component: ProfilePageComponent // The profile page
      },
      {
        path: 'aws-sso',
        component: AwsSsoComponent
      },
      {
        path: 'integrations',
        component: IntegrationsPageComponent
      },
      {
        path: 'sessions',
        children: [
          {
            path: '',
            loadChildren: './components/session/session.module#SessionModule' // Starting component for all sessions related, when the app is up and running
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
