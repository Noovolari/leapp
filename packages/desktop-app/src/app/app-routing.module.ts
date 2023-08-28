import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MainLayoutComponent } from "./layout/main-layout/main-layout.component";
import { LoginPageComponent } from "./components/login-page/login-page.component";

const routes: Routes = [
  {
    path: "dashboard",
    component: MainLayoutComponent,
  },
  {
    path: "login",
    component: LoginPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
