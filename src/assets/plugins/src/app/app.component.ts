import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'plugins';

  constructor(private router: Router) {}

  ngOnInit(): void {
    setInterval(() => {
      if(localStorage.getItem('url')) {
        this.router.navigate([localStorage.getItem('url')]);
      }
    });
  }


}
