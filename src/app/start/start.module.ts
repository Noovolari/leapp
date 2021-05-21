import {ErrorHandler, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { StartRoutingModule } from './start-routing.module';
import {StartScreenComponent} from './start-screen/start-screen.component';
import {ErrorService} from '../services/middleware/error.service';


@NgModule({
  declarations: [StartScreenComponent],
  imports: [
    CommonModule,
    StartRoutingModule
  ]
})
export class StartModule { }
