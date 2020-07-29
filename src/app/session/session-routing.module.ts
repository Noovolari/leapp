import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SessionWalletComponent } from './session-wallet/session-wallet.component';
import { SessionComponent } from './session/session.component';
import { CreateFederatedAccountComponent } from './create-federated-account/create-federated-account.component';
import { CreateTrusterAccountComponent } from './create-truster-account/create-truster-account.component';
import { ListAccountsComponent } from './list-accounts/list-accounts.component';
import { EditFederatedAccountComponent } from './edit-federated-account/edit-federated-account.component';
import { EditTrusterAccountComponent } from './edit-truster-account/edit-truster-account.component';
import { AccountComponent } from './account/account.component';
import { SessionChooseComponent } from './session-choose/session-choose.component';


const routes: Routes = [
  {
    path: '',
    component: SessionWalletComponent,
    children: [
      {
        path: 'account',
        component: AccountComponent
      },
      {
        path: 'session-selected',
        component: SessionComponent
      },
      {
        path: 'session-chooser',
        component: SessionChooseComponent
      },
      {
        path: 'create-federated-account',
        component: CreateFederatedAccountComponent
      },
      {
        path: 'create-truster-account',
        component: CreateTrusterAccountComponent
      },
      {
        path: 'edit-federated-account',
        component: EditFederatedAccountComponent
      },
      {
        path: 'edit-truster-account',
        component: EditTrusterAccountComponent
      },
      {
        path: 'list-accounts',
        component: ListAccountsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SessionRoutingModule { }
