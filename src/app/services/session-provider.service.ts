import {Injectable} from '@angular/core';
import {WorkspaceService} from "./workspace.service";
import {KeychainService} from "./keychain.service";
import {AppService} from "./app.service";
import {FileService} from "./file.service";
import {SessionService} from "./session.service";
import {AccountType} from "../models/AccountType";
import {AwsPlainService} from "./session/aws-plain.service";

@Injectable({
  providedIn: 'root'
})
export class SessionProviderService {

  private sessionServiceCache: SessionService[] = [];

  constructor(
    private workspaceService: WorkspaceService,
    private keychainService: KeychainService,
    private appService: AppService,
    private fileService: FileService) {}

  getService(accountType: AccountType): SessionService {
    // Return if service is already in the cache using flyweight pattern
    if(this.sessionServiceCache[accountType.toString()]) {
      return this.sessionServiceCache[accountType.toString()];
    }

    // Creater and save the SessionService needed; return it to the requester
    switch (accountType) {
      case AccountType.AWS: return this.getAwsSessionService(accountType);
      case AccountType.AWS_PLAIN_USER: return this.getAwsPlainSessionService(accountType);
      case AccountType.AWS_TRUSTER: return this.getAwsTrusterSessionService(accountType);
      case AccountType.AWS_SSO: return this.getAwsSsoSessionService(accountType);
      case AccountType.AZURE: return this.getAzureSessionService(accountType);
    }
  }

  private getAwsSessionService(accountType: AccountType) {
    return undefined;
  }

  private getAwsPlainSessionService(accountType: AccountType): AwsPlainService {
    const service = new AwsPlainService(this.workspaceService, this.keychainService, this.appService, this.fileService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsTrusterSessionService(accountType: AccountType) {
    return undefined;
  }

  private getAwsSsoSessionService(accountType: AccountType) {
    return undefined;
  }

  private getAzureSessionService(accountType: AccountType) {
    return undefined;
  }
}
