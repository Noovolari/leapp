import { Injectable } from "@angular/core";
import { VaultService } from "leapp-angular-common";
import { LocalSecretDto } from "leapp-team-core/encryptable-dto/local-secret-dto";
import { AppProviderService } from "./app-provider.service";
import { Repository } from "@noovolari/leapp-core/services/repository";
import { FileService } from "@noovolari/leapp-core/services/file-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { INativeService } from "@noovolari/leapp-core/interfaces/i-native-service";
import { serialize } from "class-transformer";
import { SecretType } from "leapp-team-core/encryptable-dto/secret-type";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";

@Injectable({
  providedIn: "root",
})
export class SyncTeamService {
  private repository: Repository;
  private fileService: FileService;
  private readonly localWorskpacePath: string;
  private readonly backupWorkspacePath: string;

  constructor(
    private vaultService: VaultService,
    private appProviderService: AppProviderService,
    private nativeService: INativeService,
    private sessionFactory: SessionFactory
  ) {
    this.repository = appProviderService.repository;
    this.fileService = appProviderService.fileService;
    this.localWorskpacePath = this.nativeService.os.homedir() + "/" + constants.lockFileDestination;
    this.backupWorkspacePath = this.nativeService.os.homedir() + "/" + constants.lockFileDestination + ".local";
  }

  async getSecrets(): Promise<LocalSecretDto[]> {
    return await this.vaultService.getSecrets();
  }

  async saveLocalWorkspace(): Promise<void> {
    const tempWorkspace = this.fileService.readFileSync(this.localWorskpacePath);
    this.fileService.writeFileSync(this.backupWorkspacePath, this.fileService.encryptText(serialize(tempWorkspace)));
  }

  async restoreLocalWorkspace(): Promise<void> {
    const workspaceString = this.fileService.readFileSync(this.backupWorkspacePath);
    this.fileService.writeFileSync(this.localWorskpacePath, workspaceString);
    this.repository.reloadWorkspace();
  }

  async loadTeamSessions(localSecretsDto: LocalSecretDto[]): Promise<void> {
    const workspace = this.repository.getWorkspace();
    workspace.sessions = [];
    workspace.awsSsoIntegrations = [];
    workspace.azureIntegrations = [];
    workspace.pinned = [];
    workspace.segments = [];
    localSecretsDto.forEach((localSecretDto) => {
      switch (localSecretDto.secretType) {
        case SecretType.awsIamRoleFederatedSession:
          break;
        case SecretType.awsIamRoleChainedSession:
          break;
        case SecretType.awsIamUserSession:
          break;
        case SecretType.awsSsoIntegration:
          break;
        case SecretType.azureIntegration:
          break;
      }
    });
  }
}
