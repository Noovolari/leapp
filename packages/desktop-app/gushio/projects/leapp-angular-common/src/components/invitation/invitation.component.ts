import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { LocalizationService } from "../../localization/localization.service";
import { InvitationService } from "../../invitation/invitation.service";
import { Role } from "leapp-team-core/user/role";
import { SnackbarErrorService } from "../../errors/snackbar-error.service";

@Component({
  selector: "app-invitation",
  templateUrl: "./invitation.component.html",
  styleUrls: ["./invitation.component.css", "../../../assets/forms.css"],
})
export class InvitationComponent implements OnInit {
  @Input()
  invitedUserRole!: Role;

  @Input()
  inviterId!: string;

  submitting?: boolean;
  invitationForm: FormGroup;
  email: FormControl;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly localizationService: LocalizationService,
    private readonly invitationService: InvitationService,
    private readonly snackbarService: SnackbarErrorService
  ) {
    this.invitedUserRole = this.invitedUserRole ?? Role.user;
    this.email = new FormControl("", [Validators.required, Validators.email]);
    this.invitationForm = new FormGroup({
      email: this.email,
    });
  }

  ngOnInit(): void {}

  async invite(): Promise<void> {
    if (!this.invitationForm.valid) {
      return;
    }

    this.submitting = true;
    const invitationFormValue = this.invitationForm.value;

    try {
      console.log("I'm creating the invitation");
      await this.invitationService.create(invitationFormValue.email, this.invitedUserRole, this.inviterId);
      this.snackbarService.showMessage(this.localize("InvitationCreated"));
    } catch (responseException: any) {
      this.snackbarService.showError(responseException.toString());
    } finally {
      this.submitting = false;
    }
  }

  localize(key: string): string {
    return this.localizationService.localize(key);
  }
}
