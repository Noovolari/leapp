import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent implements OnInit {

  @Input()
  account;

  /* Just a simple component to show breadcrumbs in the create session list */
  constructor(private router: Router) { }

  ngOnInit() {

  }

  /**
   * Return to Quick List
   */
  goToQuickList() {
    this.router.navigate(['/sessions', 'session-selected']);
  }

  /**
   * Go to Account Management
   */
  gotToAccountManagement() {
    this.router.navigate(['/sessions', 'list-accounts']);
  }
}
