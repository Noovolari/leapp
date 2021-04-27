import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {Workspace} from '../models/workspace';


@Injectable({
  providedIn: 'root'
})
export class WorkspaceService extends NativeService {



  constructor() {
    super();
  }

  private persist(workspace: Workspace) {

  }

  create(): Workspace {
    const workspace = new Workspace();
    this.persist(workspace);

    return workspace;
  }

}
