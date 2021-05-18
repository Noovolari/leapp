import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Workspace} from '../../models/workspace';
import {SessionType} from '../../models/session-type';
import {Session} from '../../models/session';
import {AwsPlainAccount} from '../../models/aws-plain-account';

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss']
})
export class EditAccountComponent implements OnInit {
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  accountType = SessionType.awsPlainUser;
  provider = SessionType.aws;
  selectedSession: Session;

  selectedAccountNumber = '';
  selectedRole = '';
  selectedRegion;
  regions = [];

  workspace: Workspace;

  public form = new FormGroup({
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    plainUser: new FormControl('', [Validators.required]),
    mfaDevice: new FormControl('')
  });

  /* Setup the first account for the application */
  constructor(
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // Get the workspace and the account you need
      this.selectedSession = this.workspace.sessions.filter(session => session.sessionId === params.sessionId)[0];
      const selectedAccount = (this.selectedSession.account as AwsPlainAccount);

      // Get the region
      this.regions = this.appService.getRegions();
      this.selectedRegion = this.regions.filter(r => r.region === selectedAccount.region)[0].region;
      this.form.controls['awsRegion'].setValue(this.selectedRegion);

      // Get other readonly properties
      this.form.controls['name'].setValue(selectedAccount.accountName);
      this.form.controls['mfaDevice'].setValue(selectedAccount.mfaDevice);
    });
  }

  /**
   * Set the account number when the event is called
   *
   * @param event - the event to call
   */
  setAccountNumber(event) {
    this.form.controls['accountNumber'].setValue(this.appService.extractAccountNumberFromIdpArn(event.target.value));
  }

  /**
   * Save the edited account in the workspace
   */
  saveAccount() {
  }

  formValid() {
    // TODO: Implement form validation
    return true;
  }

  goBack() {
    this.router.navigate(['/sessions', 'session-selected']);
  }

  openAccessStrategyDocumentation() {
    this.appService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }
}
