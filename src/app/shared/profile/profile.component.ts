import {Component, Input, OnInit} from '@angular/core';
import {FileService} from '../../services-system/file.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Configuration} from '../../models/configuration';
import {AppService} from '../../services-system/app.service';
import {NavigationEnd, Router} from '@angular/router';
import {WorkspaceService} from '../../services/workspace.service';
import {switchMap, tap} from 'rxjs/internal/operators';
import {AntiMemLeak} from '../../core/anti-mem-leak';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent extends AntiMemLeak implements OnInit {

  private profileIsOpen = false;

  /* The header that we shows on the app */
  constructor(
    private fileService: FileService,
    private configurationService: ConfigurationService,
    private appService: AppService,
  ) { super(); }

  ngOnInit() {
  }

  // When we toggle profile we emit is opening status
  toggleProfile() {
    this.profileIsOpen = !this.profileIsOpen; // Toggle status
    this.appService.profileOpen.emit(this.profileIsOpen); // Emit event for screen
  }
}
