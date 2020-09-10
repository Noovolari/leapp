import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StartRoutingModule } from './start-routing.module';
import {StartScreenComponent} from './start-screen/start-screen.component';


@NgModule({
  declarations: [StartScreenComponent],
  imports: [
    CommonModule,
    StartRoutingModule
  ]
})
export class StartModule { }
