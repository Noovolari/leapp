import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-integration-page',
  templateUrl: './integration-page.component.html',
  styleUrls: ['./integration-page.component.scss']
})
export class IntegrationPageComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  async goBack() {
    await this.router.navigate(['/sessions', 'session-selected']);
  }

  async goToSSO() {
    await this.router.navigate(['/', 'aws-sso']);
  }
}
