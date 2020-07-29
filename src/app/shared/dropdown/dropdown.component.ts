import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit {

  @Input() voices;

  constructor(private router: Router) { }

  ngOnInit() {}

  navigateTo(route, queryParams) {
    if (!queryParams) {
      this.router.navigate(route);
    } else {
      this.router.navigate(route, { queryParams });
    }
  }
}
