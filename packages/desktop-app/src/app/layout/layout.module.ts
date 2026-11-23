import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { TabsModule } from "ngx-bootstrap/tabs";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { MainLayoutComponent } from "./main-layout/main-layout.component";
import { ComponentsModule } from "../components/components.module";

@NgModule({
  declarations: [MainLayoutComponent],
  exports: [],
  imports: [CommonModule, TabsModule, BsDropdownModule, RouterModule, TooltipModule, ComponentsModule],
})
export class LayoutModule {}
