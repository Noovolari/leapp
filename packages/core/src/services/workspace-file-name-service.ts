import { constants } from "../models/constants";
import { BehaviorSubject } from "rxjs";

export class WorkspaceFileNameService {
  public workspaceFileNameBehaviouralSubject = new BehaviorSubject<string>(constants.lockFileDestination);
  private _workspaceFileName: string;

  constructor() {
    this.workspaceFileName = constants.lockFileDestination;
  }

  get workspaceFileName(): string {
    return this._workspaceFileName;
  }

  set workspaceFileName(value: string) {
    this._workspaceFileName = value;
    this.workspaceFileNameBehaviouralSubject.next(value);
  }

  getWorkspaceName(): string {
    if (this.workspaceFileName === constants.lockFileDestination) {
      return "My Workspace";
    } else {
      return this.workspaceFileName.substring(".Leapp/Leapp-".length, this.workspaceFileName.indexOf("-lock.json"));
    }
  }
}
