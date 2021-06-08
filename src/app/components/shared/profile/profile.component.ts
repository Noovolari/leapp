import {Component, OnInit} from '@angular/core';
import {FileService} from '../../../services/file.service';
import {AppService, LoggerLevel} from '../../../services/app.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  private profileIsOpen = false;

  /* The header that we shows on the app */
  constructor(
    private fileService: FileService,
    private appService: AppService,
  ) {}

  ngOnInit() {
    this.appService.profileOpen.subscribe(res => {
      this.profileIsOpen = res;
    });
  }

  // When we toggle profile we emit is opening status
  toggleProfile() {
    this.profileIsOpen = !this.profileIsOpen; // Toggle status
    this.appService.profileOpen.emit(this.profileIsOpen); // Emit event for screen
    this.appService.logger(`Profile open emitting: ${this.profileIsOpen}`, LoggerLevel.info, this);
  }
}
