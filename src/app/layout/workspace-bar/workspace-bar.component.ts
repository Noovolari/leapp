import { Component, OnInit } from '@angular/core';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Workspace} from '../../models/workspace';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';

@Component({
  selector: 'app-workspace-bar',
  templateUrl: './workspace-bar.component.html',
  styleUrls: ['./workspace-bar.component.scss']
})
export class WorkspaceBarComponent implements OnInit {
  workspaces: Workspace[];
  currentWorkspace: string;

  constructor(private appService: AppService, private configurationService: ConfigurationService) { }

  ngOnInit() {
    try {
      const configuration = this.configurationService.getConfigurationFileSync();
      this.workspaces = configuration.workspaces;
    } catch (error) {
      this.appService.logger(error, LoggerLevel.ERROR);
      this.appService.toast(error, ToastLevel.ERROR);
    }
    try {
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      this.currentWorkspace = workspace.name;
    } catch (error) {
      this.appService.logger(error, LoggerLevel.ERROR);
      this.appService.toast(error, ToastLevel.ERROR);
    }
  }

  setDefaultWorkspace(workspaceName: string) {
    try {
      this.configurationService.setDefaultWorkspaceSync(workspaceName);
      this.currentWorkspace = workspaceName;
      this.appService.logger('workspace set as default correctly', LoggerLevel.INFO);
    } catch (error) {
      this.appService.logger(error, LoggerLevel.ERROR);
      this.appService.toast(error, ToastLevel.ERROR);
    }
  }


}
