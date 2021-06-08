import {Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {KeychainService} from './keychain.service';
import {AppService} from './app.service';
import {FileService} from './file.service';
import {AwsSessionService} from './aws-session.service';
import {SessionType} from '../models/session-type';
import {AwsPlainService} from './session/aws-plain.service';
import {AwsTrusterService} from './session/aws-truster.service';
import {AwsFederatedService} from './session/aws-federated.service';
import {AwsSsoService} from './session/aws-sso.service';
import {AzureService} from './session/azure.service';
import {ExecuteService} from './execute.service';
import {SessionService} from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SessionFactoryService {

  private sessionServiceCache: SessionService[] = [];

  constructor(
    private workspaceService: WorkspaceService,
    private keychainService: KeychainService,
    private appService: AppService,
    private executeService: ExecuteService,
    private fileService: FileService,
    private awsSessionService: AwsSessionService) {}

  getService(accountType: SessionType): SessionService {
    // Return if service is already in the cache using flyweight pattern
    if(this.sessionServiceCache[accountType.toString()]) {
      return this.sessionServiceCache[accountType.toString()];
    }

    // Creater and save the SessionService needed; return it to the requester
    switch (accountType) {
      case SessionType.awsFederated: return this.getAwsFederatedSessionService(accountType);
      case SessionType.awsPlain: return this.getAwsPlainSessionService(accountType);
      case SessionType.awsTruster: return this.getAwsTrusterSessionService(accountType);
      case SessionType.awsSso: return this.getAwsSsoSessionService(accountType);
      case SessionType.azure: return this.getAzureSessionService(accountType);
    }
  }

  private getAwsFederatedSessionService(accountType: SessionType) {
    const service = new AwsFederatedService(this.workspaceService, this.keychainService, this.appService, this.fileService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsPlainSessionService(accountType: SessionType): AwsPlainService {
    const service = new AwsPlainService(this.workspaceService, this.keychainService, this.appService, this.fileService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsTrusterSessionService(accountType: SessionType) {
    const service = new AwsTrusterService(this.workspaceService, this.appService, this.fileService);
    // TODO: check if there is another way to avoid circular dependency
    service.setFactoryFunction(this.getService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsSsoSessionService(accountType: SessionType) {
    const service = new AwsSsoService(this.workspaceService, this.fileService, this.appService, this.keychainService, this.awsSessionService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAzureSessionService(accountType: SessionType) {
    const service = new AzureService(this.workspaceService, this.fileService, this.appService, this.executeService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }
}
