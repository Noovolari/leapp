import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SessionRoutingModule} from './session-routing.module';
import {SessionComponent} from './session/session.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {SessionWalletComponent} from './session-wallet/session-wallet.component';
import {CreateFederatedAccountComponent} from './create-federated-account/create-federated-account.component';
import {CreateTrusterAccountComponent} from './create-truster-account/create-truster-account.component';
import {ListAccountsComponent} from './list-accounts/list-accounts.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {EditTrusterAccountComponent} from './edit-truster-account/edit-truster-account.component';
import {EditFederatedAccountComponent} from './edit-federated-account/edit-federated-account.component';
import {AccountComponent} from './account/account.component';
import {BsDropdownModule, TooltipModule} from 'ngx-bootstrap';


@NgModule({
  declarations: [
    SessionWalletComponent,
    SessionComponent,
    CreateFederatedAccountComponent,
    CreateTrusterAccountComponent,
    ListAccountsComponent,
    EditTrusterAccountComponent,
    EditFederatedAccountComponent,
    AccountComponent
  ],
  imports: [
    CommonModule,
    SessionRoutingModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    TooltipModule.forRoot(),
    BsDropdownModule
  ]
})
export class SessionModule { }
