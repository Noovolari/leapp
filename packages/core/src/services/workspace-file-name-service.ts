import { constants } from "../models/constants";

export class WorkspaceFileNameService {
  private _workspaceFileName: string;

  constructor() {
    this.workspaceFileName = constants.lockFileDestination;
  }

  get workspaceFileName(): string {
    return this._workspaceFileName;
  }

  set workspaceFileName(value: string) {
    this._workspaceFileName = value;
  }
}
