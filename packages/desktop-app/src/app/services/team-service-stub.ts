import { BehaviorSubject } from "rxjs";
import { constants } from "@noovolari/leapp-core/models/constants";

interface User {
  [key: string]: any;
}

enum ApiErrorCodes {
  invalidCredentials,
  userNotActive,
  emailAlreadyTaken,
}

enum FormErrorCodes {
  invalidCredentials,
}

enum Role {
  user = "user",
  pro = "pro",
  manager = "manager",
  admin = "admin",
}

export { User, ApiErrorCodes, FormErrorCodes, Role };

export interface WorkspaceState {
  name: string;
  description: string;
  type: "local" | "team" | "pro";
  syncState: "disabled" | "enabled" | "in-progress" | "failed";
  selected: boolean;
  locked: boolean;
  id: string;
}

export class TeamService {
  constructor(_l: any, _e: any, _a: any, _p: any, _t: any, _m: any, _s: any, _r: any, _v: any, _i: any, _c: any, _n: any, _o: any, _y: any) {}

  get isLeappTeamStubbed(): boolean {
    return true;
  }

  get signedInUserState(): BehaviorSubject<User | null> {
    return new BehaviorSubject<User | null>(null);
  }

  get workspacesState(): BehaviorSubject<WorkspaceState[]> {
    return new BehaviorSubject<WorkspaceState[]>([
      {
        name: constants.localWorkspaceName,
        description: constants.localWorkspaceDescription,
        type: "local",
        syncState: "disabled",
        selected: true,
        locked: false,
        id: constants.localWorkspaceKeychainValue,
      },
    ]);
  }

  get syncingWorkspaceState(): BehaviorSubject<boolean> {
    return new BehaviorSubject<boolean>(false);
  }

  async getTeamStatus(): Promise<string> {
    return "you're not logged in";
  }

  async setCurrentWorkspace(_: boolean = false): Promise<void> {}

  async signIn(_: string, __: string): Promise<void> {}

  async signOut(_: boolean = false): Promise<void> {}

  async writeTouchIdCredentials(_: string, __: number): Promise<void> {}

  async deleteTeamWorkspace(): Promise<void> {}

  async switchToLocalWorkspace(): Promise<void> {}

  async refreshWorkspaceState(_?: () => Promise<void>): Promise<void> {}

  async createCheckoutSession(_?: any, __?: any): Promise<any> {
    return "checkout-session-url";
  }

  async getPrices(): Promise<any> {
    return [];
  }

  setSyncState(_?: any): void {}

  async pushToRemote(): Promise<void> {}

  async pullFromRemote(_?: any): Promise<void> {}

  async removeSessionsAndIntegrationsFromCurrentWorkspace(): Promise<void> {}

  async getKeychainCurrentWorkspace(): Promise<string> {
    return "current-workspace";
  }

  async setKeychainCurrentWorkspace(_: string): Promise<void> {}

  async exportProWorkspace(): Promise<void> {}
}
