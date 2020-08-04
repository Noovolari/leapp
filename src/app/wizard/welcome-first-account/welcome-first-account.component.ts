import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-first-account',
  templateUrl: './welcome-first-account.component.html',
  styleUrls: ['./welcome-first-account.component.scss']
})
export class WelcomeFirstAccountComponent implements OnInit {
  /* Just used to welcome to the setup phase */
  constructor(private router: Router) { }

  ngOnInit() {}

  /**
   * Go to the first account form
   */
  gotToFirstAccount() {
    this.router.navigate(['/wizard', 'setup-first-account']);
  }
}
