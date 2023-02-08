import { Injectable } from "@angular/core";
import { VaultService } from "leapp-angular-common";
import { LocalSecretDto } from "leapp-team-core/encryptable-dto/local-secret-dto";
import { AppProviderService } from "./app-provider.service";
import { Repository } from "@noovolari/leapp-core/services/repository";
import { FileService } from "@noovolari/leapp-core/services/file-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { serialize } from "class-transformer";
import { SecretType } from "leapp-team-core/encryptable-dto/secret-type";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { IntegrationFactory } from "@noovolari/leapp-core/services/integration-factory";
import { AppNativeService } from "./app-native.service";
import { IBehaviouralNotifier } from "@noovolari/leapp-core/interfaces/i-behavioural-notifier";
import { awsIamUserSessionRequestFromDto } from "@noovolari/leapp-core/services/session/aws/aws-iam-user-session-request";

@Injectable({
  providedIn: "root",
})
export class SyncTeamService {
  private readonly repository: Repository;
  private readonly fileService: FileService;
  private readonly sessionFactory: SessionFactory;
  private readonly integrationFactory: IntegrationFactory;
  private readonly localWorskpacePath: string;
  private readonly backupWorkspacePath: string;
  private readonly behaviouralSubjectService: IBehaviouralNotifier;

  constructor(private vaultService: VaultService, private appProviderService: AppProviderService, private nativeService: AppNativeService) {
    this.repository = appProviderService.repository;
    this.fileService = appProviderService.fileService;
    this.sessionFactory = appProviderService.sessionFactory;
    this.integrationFactory = appProviderService.integrationFactory;
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.localWorskpacePath = this.nativeService.os.homedir() + "/" + constants.lockFileDestination;
    this.backupWorkspacePath = this.nativeService.os.homedir() + "/" + constants.lockFileDestination + ".local";
  }

  setLocalSessions(): void {
    this.restoreLocalWorkspace();
    const workspace = this.repository.getWorkspace();
    this.behaviouralSubjectService.setSessions(workspace.sessions);
    this.behaviouralSubjectService.setIntegrations([...workspace.awsSsoIntegrations, ...workspace.azureIntegrations]);
  }

  async setTeamSessions(localSecretsDto: LocalSecretDto[]): Promise<void> {
    this.saveLocalWorkspace();
    const workspace = this.repository.getWorkspace();
    workspace.sessions = [];
    workspace.awsSsoIntegrations = [];
    workspace.azureIntegrations = [];
    workspace.pinned = [];
    workspace.segments = [];
    for (const localSecretDto of localSecretsDto) {
      switch (localSecretDto.secretType) {
        case SecretType.awsIamRoleFederatedSession:
          await this.sessionFactory.createSession(
            SessionType.awsIamRoleFederated,
            Object.keys(localSecretDto).map((key) => ({ [key.replace("secret", "session")]: localSecretDto[key] })) as any
          );
          break;
        case SecretType.awsIamRoleChainedSession:
          await this.sessionFactory.createSession(SessionType.awsIamRoleChained, awsIamUserSessionRequestFromDto(localSecretDto, "default"));
          break;
        case SecretType.awsIamUserSession:
          await this.sessionFactory.createSession(
            SessionType.awsIamUser,
            Object.keys(localSecretDto).map((key) => ({ [key.replace("secret", "session")]: localSecretDto[key] })) as any
          );
          break;
        case SecretType.awsSsoIntegration:
          await this.integrationFactory.create(IntegrationType.awsSso, localSecretDto as any);
          break;
        case SecretType.azureIntegration:
          await this.integrationFactory.create(IntegrationType.azure, localSecretDto as any);
          break;
      }
    }
    this.behaviouralSubjectService.setSessions(workspace.sessions);
    this.behaviouralSubjectService.setIntegrations([...workspace.awsSsoIntegrations, ...workspace.azureIntegrations]);
  }

  private restoreLocalWorkspace(): void {
    const workspaceString = this.fileService.readFileSync(this.backupWorkspacePath);
    this.fileService.writeFileSync(this.localWorskpacePath, workspaceString);
    this.repository.reloadWorkspace();
  }

  private saveLocalWorkspace(): void {
    const tempWorkspace = this.fileService.readFileSync(this.localWorskpacePath);
    this.fileService.writeFileSync(this.backupWorkspacePath, this.fileService.encryptText(serialize(tempWorkspace)));
  }
}
