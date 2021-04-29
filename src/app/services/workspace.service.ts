import {Injectable} from '@angular/core';
import {FileService} from '../services-system/file.service';
import {AppService} from '../services-system/app.service';
import {Session} from '../models/session';
import {Workspace} from '../models/workspace';
import {environment} from '../../environments/environment';
import {deserialize, serialize} from 'class-transformer';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  constructor(private appService: AppService, private fileService: FileService) {}

  private persist(workspace: Workspace) {
    this.fileService.writeFileSync(
      this.appService.getOS().homedir() + '/' + environment.lockFileDestination,
      this.fileService.encryptText(serialize(workspace))
    );
  }

  create(): void {
    const workspace = new Workspace();
    this.persist(workspace);
  }

  get(): Workspace {
    const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination));
    return deserialize(Workspace, workspaceJSON);
  }

  getSessions(): Session[] {
    const workspace = this.get();
    return workspace.sessions;
  }

  updateSessions(sessions: Session[]): void {
    const workspace = this.get();
    workspace.sessions = sessions;
    this.persist(workspace);
  }
}
