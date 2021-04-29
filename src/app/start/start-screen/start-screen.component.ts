import {Component, Input} from '@angular/core';
import {AppService} from '../../services-system/app.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-wizard-page',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent {

  @Input() versionLabel = '...';

  /**
   * Dependencies Page is used to check if we already have the correct configuratrion and send you to the session page or to the setup managing otherwise
   */
  constructor(private app: AppService, private router: Router) {}

  goToSetup() {
    this.router.navigate(['/managing', 'create-account'], { queryParams: { firstTime: true }});
  }

  openDocumentation() {
    this.app.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }


}
