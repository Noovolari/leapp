import { NgModule } from "@angular/core";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { CommonModule } from "@angular/common";
import { SignInComponent } from "./components/signin/sign-in.component";
import { SignupComponent } from "./components/signup/signup.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { InvitationComponent } from "./components/invitation/invitation.component";

@NgModule({
  declarations: [SignInComponent, SignupComponent, InvitationComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  exports: [SignInComponent, SignupComponent, InvitationComponent],
})
export class LeappAngularCommonModule {}
