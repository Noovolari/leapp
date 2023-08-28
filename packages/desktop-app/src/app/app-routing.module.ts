import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MainLayoutComponent } from "./layout/main-layout/main-layout.component";
import { LockPageComponent } from "./components/lock-page/lock-page.component";

const routes: Routes = [
  {
    path: "dashboard",
    component: MainLayoutComponent,
  },
  {
    path: "lock",
    component: LockPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
