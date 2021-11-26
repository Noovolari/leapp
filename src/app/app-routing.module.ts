import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ProfilePageComponent} from './components/shared/profile-page/profile-page.component';
import {IntegrationComponent} from './components/integration/integration.component';

const routes: Routes = [
    {
    path: '',
    children: [
      {
        path: 'start',
        loadChildren: () => import('./components/components.module').then(m => m.ComponentsModule) // contains all the components that defines the initial setup
      },
      {
        path: 'managing',
        loadChildren: () => import('./components/components.module').then(m => m.ComponentsModule), // contains all the components that defines the initial setup
      },
      {
        path: 'profile',
        component: ProfilePageComponent // The profile page
      },
      {
        path: 'integration',
        component: IntegrationComponent
      },
      {
        path: 'sessions',
        children: [
          {
            path: '',
            loadChildren: () => import('./components/session/session.module').then(m => m.SessionModule) // Starting component for all sessions related, when the app is up and running
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
