import {Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {KeychainService} from './keychain.service';
import {AppService} from './app.service';
import {FileService} from './file.service';
import {SessionService} from './session.service';
import {SessionType} from '../models/session-type';
import {AwsPlainService} from './session/aws-plain.service';

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

  getService(accountType: SessionType): SessionService {
    // Return if service is already in the cache using flyweight pattern
    if(this.sessionServiceCache[accountType.toString()]) {
      return this.sessionServiceCache[accountType.toString()];
    }

    // Creater and save the SessionService needed; return it to the requester
    switch (accountType) {
      case SessionType.AWS: return this.getAwsSessionService(accountType);
      case SessionType.AWS_PLAIN_USER: return this.getAwsPlainSessionService(accountType);
      case SessionType.AWS_TRUSTER: return this.getAwsTrusterSessionService(accountType);
      case SessionType.AWS_SSO: return this.getAwsSsoSessionService(accountType);
      case SessionType.AZURE: return this.getAzureSessionService(accountType);
    }
  }

  private getAwsSessionService(accountType: SessionType) {
    return undefined;
  }

  private getAwsPlainSessionService(accountType: SessionType): AwsPlainService {
    const service = new AwsPlainService(this.workspaceService, this.keychainService, this.appService, this.fileService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsTrusterSessionService(accountType: SessionType) {
    return undefined;
  }

  private getAwsSsoSessionService(accountType: SessionType) {
    return undefined;
  }

  private getAzureSessionService(accountType: SessionType) {
    return undefined;
  }
}
