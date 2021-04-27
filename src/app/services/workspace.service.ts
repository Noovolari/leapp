import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {Workspace} from '../models/workspace';
import {Configuration} from '../models/configuration';
import {environment} from '../../environments/environment';
import {FileService} from '../services-system/file.service';
import {Session} from '../models/session';


@Injectable({
  providedIn: 'root'
})
export class WorkspaceService extends NativeService {



  constructor(private fileService: FileService) {
    super();
  }

  private persist(workspace: Workspace) {
    const path = this.os.homedir() + '/' + environment.lockFileDestination;
    this.fileService.writeFileSync(path, this.fileService.encryptText(JSON.stringify(workspace, null, 2)));
  }

  create(): Workspace {
    const workspace = new Workspace();
    this.persist(workspace);

    return workspace;
  }

  get(): Workspace {
    return JSON.parse(this.fileService.decryptText(
      this.fileService.readFileSync(this.os.homedir() + '/' + environment.lockFileDestination)
      )
    ) as Workspace;
  }

  updateSessions(sessions: Session[]): Workspace {
    const workspace = this.get();
    workspace.sessions = sessions;
    this.persist(workspace);
    return workspace;
  }
}
