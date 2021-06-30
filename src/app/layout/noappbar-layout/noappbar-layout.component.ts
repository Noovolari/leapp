import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-no-appbar',
  templateUrl: './noappbar-layout.component.html',
  styleUrls: ['./noappbar-layout.component.scss']
})
export class NoAppbarLayoutComponent implements OnInit {
  /* Basically a layout without style for windows that need fullscreen without menu */
  ngOnInit() {}
}
