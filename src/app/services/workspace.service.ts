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
    const path = this.appService.getOS().homedir() + '/' + environment.lockFileDestination;
    this.fileService.writeFileSync(path, this.fileService.encryptText(JSON.stringify(workspace, null, 2)));
  }

  create(): Workspace {
    try {
      return this.get();
    } catch (err) {
      const workspace = new Workspace();
      this.persist(workspace);
      return workspace;
    }
  }

  get(): Workspace {
    return JSON.parse(this.fileService.decryptText(
      this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)
      )
    ) as Workspace;
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
