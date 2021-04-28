import {Injectable} from '@angular/core';
import {FileService} from '../services-system/file.service';
import {AppService} from '../services-system/app.service';
import {Session} from '../models/session';
import {Workspace} from '../models/workspace';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  constructor(private appService: AppService, private fileService: FileService) {}

  private persist(workspace: Workspace) {
    this.fileService.writeFileSync(
      this.appService.getOS().homedir() + '/' + environment.lockFileDestination,
      this.fileService.encryptText(JSON.stringify(workspace, null, 2))
    );
  }

  create(): void {
    const workspace = new Workspace();
    this.persist(workspace);
  }

  get(): Workspace {
    const workspaceFile = this.fileService.decryptText(this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination));
    const workspaceObject = JSON.parse(workspaceFile);

    const workspace = new Workspace();
    workspace.deserialize(workspaceObject.idpUrl, workspaceObject.profiles, workspaceObject.sessions, workspaceObject.proxyConfiguration, workspaceObject.defaultRegion, workspaceObject.defaultLocation);
    return workspace;
  }

  getSessions(): Session[] {
    const workspace = this.get();
    return workspace.sessions;
  }

  updateSessions(sessions: Session[]): Workspace {
    const workspace = this.get();
    workspace.sessions = sessions;
    this.persist(workspace);
    return workspace;
  }
}
