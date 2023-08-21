import { BehaviorSubject } from "rxjs";
import { constants } from "@noovolari/leapp-core/models/constants";

interface User {
  [key: string]: any;
}

enum ApiErrorCodes {
  invalidCredentials,
  userNotActive,
}

enum FormErrorCodes {
  invalidCredentials,
}

export { User, ApiErrorCodes, FormErrorCodes };

export interface WorkspaceState {
  name: string;
  description: string;
  id: string;
}

export class TeamService {
  constructor(_l: any, _e: any, _a: any, _p: any, _t: any, _m: any, _s: any, _r: any, _v: any, _i: any, _c: any, _n: any, _o: any) {}

  get isLeappTeamStubbed(): boolean {
    return true;
  }

  get signedInUserState(): BehaviorSubject<User | null> {
    return new BehaviorSubject<User | null>(null);
  }

  get workspaceState(): BehaviorSubject<WorkspaceState> {
    return new BehaviorSubject<WorkspaceState>({
      name: constants.localWorkspaceName,
      description: constants.localWorkspaceDescription,
      id: constants.localWorkspaceKeychainValue,
    });
  }

  get switchingWorkspaceState(): BehaviorSubject<boolean> {
    return new BehaviorSubject<boolean>(false);
  }

  async getTeamStatus(): Promise<string> {
    return "you're not logged in";
  }

  async setCurrentWorkspace(_: boolean = false): Promise<void> {}

  async signIn(_: string, __: string): Promise<void> {}

  async signOut(_: boolean = false): Promise<void> {}

  async syncSecrets(_: boolean = false): Promise<void> {}

  async deleteTeamWorkspace(): Promise<void> {}

  async switchToLocalWorkspace(): Promise<void> {}

  async refreshWorkspaceState(_?: () => Promise<void>): Promise<void> {}
}
