import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-setup-welcome',
  templateUrl: './setup-welcome.component.html',
  styleUrls: ['./setup-welcome.component.scss']
})
export class SetupWelcomeComponent implements OnInit {
  /* Just send the user to setup federation url */
  constructor(
    private router: Router
  ) { }

  ngOnInit() {}

  /**
   * Go to the definition of the first idp url
   */
  gotToFirstIdpUrl() {
    this.router.navigate(['/wizard', 'setup-federation-url']);
  }

}
