/*
 * Regression harness for the workspace baseline in ./reference.
 *
 * Wires core the way the CLI does (CliProviderService), with only the boundaries outside our control faked:
 * the keychain (in-memory IKeychainService), the MFA prompt, the SAML identity provider, the SSO-OIDC
 * verification window and the logger. Filesystem, INI library (js-ini, injected by both clients),
 * encryption and every core service are real. AWS SDK clients are mocked by the specs with aws-sdk-client-mock.
 */
import * as fsExtra from "fs-extra";
import * as os from "os";
import * as path from "path";
import { serialize } from "class-transformer";
import { INativeService } from "../../src/interfaces/i-native-service";
import { IKeychainService } from "../../src/interfaces/i-keychain-service";
import { IMfaCodePrompter } from "../../src/interfaces/i-mfa-code-prompter";
import { IAwsSamlAuthenticationService } from "../../src/interfaces/i-aws-saml-authentication-service";
import { IAwsSsoOidcVerificationWindowService } from "../../src/interfaces/i-aws-sso-oidc-verification-window-service";
import { ILogger } from "../../src/interfaces/i-logger";
import { LogLevel, LogService } from "../../src/services/log-service";
import { FileService } from "../../src/services/file-service";
import { WorkspaceConsistencyService } from "../../src/services/workspace-consistency-service";
import { Repository } from "../../src/services/repository";
import { AwsCoreService } from "../../src/services/aws-core-service";
import { BehaviouralSubjectService } from "../../src/services/behavioural-subject-service";
import { AwsIamUserService } from "../../src/services/session/aws/aws-iam-user-service";
import { AwsIamRoleFederatedService } from "../../src/services/session/aws/aws-iam-role-federated-service";
import { AwsIamRoleChainedService } from "../../src/services/session/aws/aws-iam-role-chained-service";
import { AwsSsoRoleService } from "../../src/services/session/aws/aws-sso-role-service";
import { AwsParentSessionFactory } from "../../src/services/session/aws/aws-parent-session.factory";
import { LocalstackSessionService } from "../../src/services/session/localstack/localstack-session-service";
import { AzureSessionService } from "../../src/services/session/azure/azure-session-service";
import { AzurePersistenceService } from "../../src/services/azure-persistence-service";
import { ExecuteService } from "../../src/services/execute-service";
import { AwsSsoOidcService } from "../../src/services/aws-sso-oidc.service";
import { AwsSsoIntegrationService } from "../../src/services/integration/aws-sso-integration-service";
import { SessionFactory } from "../../src/services/session-factory";
import { Workspace } from "../../src/models/workspace";
import { AwsNamedProfile } from "../../src/models/aws/aws-named-profile";
import { IdpUrl } from "../../src/models/idp-url";
import { AwsSsoIntegration } from "../../src/models/aws/aws-sso-integration";
import { AzureIntegration } from "../../src/models/azure/azure-integration";
import { AwsIamUserSession } from "../../src/models/aws/aws-iam-user-session";
import { AwsIamRoleFederatedSession } from "../../src/models/aws/aws-iam-role-federated-session";
import { AwsIamRoleChainedSession } from "../../src/models/aws/aws-iam-role-chained-session";
import { AwsSsoRoleSession } from "../../src/models/aws/aws-sso-role-session";
import { LocalstackSession } from "../../src/models/localstack/localstack-session";
import { AzureSession } from "../../src/models/azure/azure-session";
import { Session } from "../../src/models/session";
import { constants } from "../../src/models/constants";
import { SessionType } from "../../src/models/session-type";
import { SessionStatus } from "../../src/models/session-status";
import { mockClient } from "aws-sdk-client-mock";
import { AssumeRoleCommand, AssumeRoleWithSAMLCommand, GetSessionTokenCommand, STSClient } from "@aws-sdk/client-sts";
import { GetRoleCredentialsCommand, SSOClient } from "@aws-sdk/client-sso";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsIni = require("js-ini");

export const testMachineId = "ls-bump-001-test-machine-id";
export const referenceDir = path.resolve(__dirname, "reference");
export const workspaceNames = ["credential-file", "credential-process"] as const;
export type WorkspaceName = (typeof workspaceNames)[number];

export const fixturePaths = {
  plaintext: (name: WorkspaceName): string => path.join(referenceDir, `${name}.workspace.json`),
  encrypted: (name: WorkspaceName): string => path.join(referenceDir, "encrypted", `${name}.Leapp-lock.json`),
  initialAwsCredentials: path.join(referenceDir, "initial", "aws-credentials"),
  initialAwsConfig: path.join(referenceDir, "initial", "aws-config"),
  goldenAfterLoadSave: (name: WorkspaceName): string => path.join(referenceDir, "golden", `${name}.after-load-save.json`),
  goldenAwsCredentials: (name: WorkspaceName): string => path.join(referenceDir, "golden", `${name}.aws-credentials`),
  goldenAwsConfig: (name: WorkspaceName): string => path.join(referenceDir, "golden", `${name}.aws-config`),
};

// Fixed identifiers: fake account 111111111111, no real data.
export const ids = {
  profileDefault: "profile-default",
  profileIamUser: "profile-iam-user",
  profileIamUserMfa: "profile-iam-user-mfa",
  profileFederated: "profile-federated",
  profileChained: "profile-chained",
  profileSso: "profile-sso",
  profileLocalstack: "profile-localstack",
  idpUrl: "idp-url-1",
  awsSsoIntegration: "aws-sso-integration-1",
  azureIntegration: "azure-integration-1",
  sessionIamUser: "session-iam-user",
  sessionIamUserMfa: "session-iam-user-mfa",
  sessionFederated: "session-federated",
  sessionChained: "session-chained",
  sessionSso: "session-sso",
  sessionLocalstack: "session-localstack",
  sessionAzure: "session-azure",
};

export const fake = {
  mfaDevice: "arn:aws:iam::111111111111:mfa/ls-bump-001",
  mfaCode: "123456",
  samlAssertion: "ZmFrZS1zYW1sLWFzc2VydGlvbg==",
  idpArn: "arn:aws:iam::111111111111:saml-provider/ls-bump-001-idp",
  federatedRoleArn: "arn:aws:iam::111111111111:role/ls-bump-001-federated",
  chainedRoleArn: "arn:aws:iam::111111111111:role/ls-bump-001-chained",
  ssoRoleArn: "arn:aws:iam::111111111111:role/ls-bump-001-sso",
  ssoAccessToken: "sso-access-token-example",
  iamUserAccessKeyId: "AKIAIAMUSEREXAMPLE",
  iamUserSecretAccessKey: "iam-user-secret-access-key-example",
  iamUserMfaAccessKeyId: "AKIAIAMUSERMFAEXAMPLE",
  iamUserMfaSecretAccessKey: "iam-user-mfa-secret-access-key-example",
};

/** Builds a fixture workspace with every session type. Only used by the recorder on the baseline code. */
export const buildFixtureWorkspace = (name: WorkspaceName): Workspace => {
  const workspace = new Workspace();
  workspace.setNewWorkspaceVersion();
  workspace.profiles = [
    new AwsNamedProfile(ids.profileDefault, constants.defaultAwsProfileName),
    new AwsNamedProfile(ids.profileIamUser, "ls-iam-user"),
    new AwsNamedProfile(ids.profileIamUserMfa, "ls-iam-user-mfa"),
    new AwsNamedProfile(ids.profileFederated, "ls-federated"),
    new AwsNamedProfile(ids.profileChained, "ls-chained"),
    new AwsNamedProfile(ids.profileSso, "ls-sso"),
    new AwsNamedProfile(ids.profileLocalstack, "ls-localstack"),
  ];
  workspace.idpUrls = [new IdpUrl(ids.idpUrl, "https://idp.example.com/saml/ls-bump-001")];
  workspace.awsSsoIntegrations = [
    new AwsSsoIntegration(
      ids.awsSsoIntegration,
      "Example SSO",
      "https://example.awsapps.com/start",
      "eu-west-1",
      constants.inBrowser,
      "2099-01-01T00:00:00.000Z"
    ),
  ];
  workspace.azureIntegrations = [new AzureIntegration(ids.azureIntegration, "Example Azure", "00000000-0000-0000-0000-000000000001", "westeurope")];
  workspace.defaultRegion = "eu-west-1";
  workspace.colorTheme = constants.darkTheme;
  workspace.proxyConfiguration = { proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128" };
  workspace.credentialMethod = name === "credential-file" ? constants.credentialFile : constants.credentialProcess;

  const withId = <T extends Session>(session: T, sessionId: string): T => {
    session.sessionId = sessionId;
    return session;
  };
  const sessions: Session[] = [
    withId(new AwsIamUserSession("LS iam user", "eu-west-1", ids.profileIamUser), ids.sessionIamUser),
    withId(new AwsIamUserSession("LS iam user mfa", "eu-central-1", ids.profileIamUserMfa, fake.mfaDevice), ids.sessionIamUserMfa),
    withId(
      new AwsIamRoleFederatedSession("LS federated", "us-east-1", ids.idpUrl, fake.idpArn, fake.federatedRoleArn, ids.profileFederated),
      ids.sessionFederated
    ),
    withId(
      new AwsIamRoleChainedSession("LS chained", "us-west-2", fake.chainedRoleArn, ids.profileChained, ids.sessionIamUser, "ls-bump-001-chained"),
      ids.sessionChained
    ),
    withId(new AwsSsoRoleSession("LS sso", "eu-west-1", fake.ssoRoleArn, ids.profileSso, ids.awsSsoIntegration, "user@example.com"), ids.sessionSso),
    withId(
      new AzureSession(
        "LS azure",
        "westeurope",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000001",
        ids.azureIntegration
      ),
      ids.sessionAzure
    ),
  ];
  if (name === "credential-file") {
    sessions.push(withId(new LocalstackSession("LS localstack", "us-east-1", ids.profileLocalstack), ids.sessionLocalstack));
  }
  workspace.sessions = sessions;
  workspace.pinned = [ids.sessionIamUser];
  return workspace;
};

/** Session ids started by AC5, in order, per workspace. */
export const sessionsToStart = (name: WorkspaceName): { id: string; type: SessionType }[] => {
  const list = [
    { id: ids.sessionIamUser, type: SessionType.awsIamUser },
    { id: ids.sessionIamUserMfa, type: SessionType.awsIamUser },
    { id: ids.sessionFederated, type: SessionType.awsIamRoleFederated },
    { id: ids.sessionChained, type: SessionType.awsIamRoleChained },
    { id: ids.sessionSso, type: SessionType.awsSsoRole },
  ];
  return name === "credential-file" ? [...list, { id: ids.sessionLocalstack, type: SessionType.localstack }] : list;
};

export class InMemoryKeychain implements IKeychainService {
  readonly store = new Map<string, string>();

  async saveSecret(service: string, account: string, password: string): Promise<void> {
    this.store.set(`${service}/${account}`, password);
  }

  async getSecret(service: string, account: string): Promise<string | null> {
    return this.store.get(`${service}/${account}`) ?? null;
  }

  async deleteSecret(service: string, account: string): Promise<boolean> {
    return this.store.delete(`${service}/${account}`);
  }
}

/** Keychain content a user of the baseline release would have for the fixture sessions. */
export const seedKeychain = async (keychain: InMemoryKeychain): Promise<void> => {
  await keychain.saveSecret(constants.appName, `${ids.sessionIamUser}-iam-user-aws-session-access-key-id`, fake.iamUserAccessKeyId);
  await keychain.saveSecret(constants.appName, `${ids.sessionIamUser}-iam-user-aws-session-secret-access-key`, fake.iamUserSecretAccessKey);
  await keychain.saveSecret(constants.appName, `${ids.sessionIamUserMfa}-iam-user-aws-session-access-key-id`, fake.iamUserMfaAccessKeyId);
  await keychain.saveSecret(constants.appName, `${ids.sessionIamUserMfa}-iam-user-aws-session-secret-access-key`, fake.iamUserMfaSecretAccessKey);
  await keychain.saveSecret(constants.appName, `aws-sso-integration-access-token-${ids.awsSsoIntegration}`, fake.ssoAccessToken);
};

export class RecordingLogger implements ILogger {
  readonly entries: { message: string; level: LogLevel }[] = [];

  log(message: string, level: LogLevel): void {
    this.entries.push({ message, level });
  }

  show(message: string, level: LogLevel): void {
    this.entries.push({ message, level });
  }

  errors(): string[] {
    return this.entries.filter((e) => e.level === LogLevel.error).map((e) => e.message);
  }
}

export const createNativeService = (homeDir: string): INativeService => {
  const testOs = Object.create(os);
  testOs.homedir = () => homeDir;
  return {
    fs: fsExtra,
    os: testOs,
    path,
    ini: jsIni,
    machineId: testMachineId,
    process,
  } as unknown as INativeService;
};

export interface Core {
  nativeService: INativeService;
  logger: RecordingLogger;
  fileService: FileService;
  repository: Repository;
  sessionFactory: SessionFactory;
}

/** Same wiring as CliProviderService, with the fakes described at the top of this file. */
export const createCore = (homeDir: string, keychain: IKeychainService): Core => {
  const nativeService = createNativeService(homeDir);
  const logger = new RecordingLogger();
  const logService = new LogService(logger);
  const fileService = new FileService(nativeService);
  const workspaceConsistencyService = new WorkspaceConsistencyService(fileService, nativeService, logService);
  const repository = new Repository(nativeService, fileService, workspaceConsistencyService);
  const behaviouralSubjectService = new BehaviouralSubjectService(repository);
  const awsCoreService = new AwsCoreService(undefined, nativeService, logService);

  const mfaCodePrompter: IMfaCodePrompter = { promptForMFACode: (_sessionName, callback) => callback(fake.mfaCode) };
  const samlAuthenticationService: IAwsSamlAuthenticationService = {
    needAuthentication: async () => false,
    awsSignIn: async () => fake.samlAssertion,
    closeAuthenticationWindow: async () => {},
  };
  const verificationWindowService: IAwsSsoOidcVerificationWindowService = {
    openVerificationWindow: async () => {
      throw new Error("regression harness: the SSO access token is valid, no device authorization is expected");
    },
  };

  const awsIamUserService = new AwsIamUserService(
    behaviouralSubjectService,
    repository,
    mfaCodePrompter,
    mfaCodePrompter,
    keychain,
    fileService,
    awsCoreService
  );
  const awsIamRoleFederatedService = new AwsIamRoleFederatedService(
    behaviouralSubjectService,
    repository,
    fileService,
    awsCoreService,
    samlAuthenticationService,
    constants.samlRoleSessionDuration
  );
  const awsSsoOidcService = new AwsSsoOidcService(verificationWindowService, repository, true);
  const awsSsoRoleService = new AwsSsoRoleService(
    behaviouralSubjectService,
    repository,
    fileService,
    keychain,
    awsCoreService,
    nativeService,
    awsSsoOidcService
  );
  const awsParentSessionFactory = new AwsParentSessionFactory(awsIamUserService, awsIamRoleFederatedService, awsSsoRoleService);
  const awsIamRoleChainedService = new AwsIamRoleChainedService(
    behaviouralSubjectService,
    repository,
    awsCoreService,
    fileService,
    awsIamUserService,
    awsParentSessionFactory
  );
  const localstackSessionService = new LocalstackSessionService(behaviouralSubjectService, repository, awsCoreService, fileService);
  const executeService = new ExecuteService(nativeService, repository, logService);
  const azurePersistenceService = new AzurePersistenceService(nativeService, keychain);
  const azureSessionService = new AzureSessionService(
    behaviouralSubjectService,
    repository,
    fileService,
    executeService,
    constants.azureMsalCacheFile,
    nativeService,
    azurePersistenceService,
    logService
  );
  const sessionFactory = new SessionFactory(
    awsIamUserService,
    awsIamRoleFederatedService,
    awsIamRoleChainedService,
    awsSsoRoleService,
    azureSessionService,
    localstackSessionService
  );
  const awsSsoIntegrationService = new AwsSsoIntegrationService(
    repository,
    keychain,
    behaviouralSubjectService,
    nativeService,
    sessionFactory,
    awsSsoOidcService,
    awsSsoRoleService
  );
  awsSsoRoleService.setAwsIntegrationDelegate(awsSsoIntegrationService);

  return { nativeService, logger, fileService, repository, sessionFactory };
};

export const lockFilePath = (homeDir: string): string => path.join(homeDir, constants.lockFileDestination);

/** Writes a plaintext workspace into HOME as an encrypted Leapp-lock.json, the way Repository does. */
export const installEncryptedWorkspace = (homeDir: string, plaintext: string): void => {
  const fileService = new FileService(createNativeService(homeDir));
  fsExtra.mkdirpSync(path.dirname(lockFilePath(homeDir)));
  fsExtra.writeFileSync(lockFilePath(homeDir), fileService.encryptText(plaintext));
};

export const readDecryptedWorkspace = (homeDir: string): string => {
  const fileService = new FileService(createNativeService(homeDir));
  return fileService.decryptText(fsExtra.readFileSync(lockFilePath(homeDir), "utf-8"));
};

export const installInitialAwsFiles = (homeDir: string): void => {
  fsExtra.mkdirpSync(path.join(homeDir, ".aws"));
  fsExtra.copyFileSync(fixturePaths.initialAwsCredentials, path.join(homeDir, ".aws", "credentials"));
  fsExtra.copyFileSync(fixturePaths.initialAwsConfig, path.join(homeDir, ".aws", "config"));
};

export const readAwsFile = (homeDir: string, file: "credentials" | "config"): string =>
  fsExtra.readFileSync(path.join(homeDir, ".aws", file), "utf-8");

export const createTempHome = (): string => fsExtra.mkdtempSync(path.join(os.tmpdir(), "ls-bump-001-"));

export const serializeWorkspace = (workspace: Workspace): string => serialize(workspace);

const stsCredentials = (prefix: string) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AccessKeyId: `ASIA${prefix.toUpperCase().replace(/-/g, "")}EXAMPLE`,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SecretAccessKey: `${prefix}-secret-access-key-example`,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SessionToken: `${prefix}-session-token-example`,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Expiration: new Date("2099-01-01T01:00:00.000Z"),
});

/** Mocks STS and SSO with fixed responses. Call restore() in afterEach. */
export const mockAwsSdk = (): { restore: () => void } => {
  const sts = mockClient(STSClient);
  sts.on(GetSessionTokenCommand).resolves({ ["Credentials"]: stsCredentials("iam-user") });
  sts
    .on(GetSessionTokenCommand, { ["SerialNumber"]: fake.mfaDevice, ["TokenCode"]: fake.mfaCode })
    .resolves({ ["Credentials"]: stsCredentials("iam-user-mfa") });
  sts.on(AssumeRoleWithSAMLCommand).resolves({ ["Credentials"]: stsCredentials("federated") });
  sts.on(AssumeRoleCommand).resolves({ ["Credentials"]: stsCredentials("chained") });
  const sso = mockClient(SSOClient);
  sso.on(GetRoleCredentialsCommand).resolves({
    roleCredentials: {
      accessKeyId: "ASIASSOEXAMPLE",
      secretAccessKey: "sso-secret-access-key-example",
      sessionToken: "sso-session-token-example",
      expiration: Date.parse("2099-01-01T01:00:00.000Z"),
    },
  });
  return {
    restore: () => {
      sts.restore();
      sso.restore();
    },
  };
};

/** AC4 flow: an encrypted workspace in HOME is loaded and saved by core; returns the saved file, decrypted. */
export const runLoadSave = (homeDir: string, plaintext: string): { savedPlaintext: string; errors: string[] } => {
  installEncryptedWorkspace(homeDir, plaintext);
  const core = createCore(homeDir, new InMemoryKeychain());
  core.repository.persistWorkspace(core.repository.getWorkspace());
  return { savedPlaintext: readDecryptedWorkspace(homeDir), errors: core.logger.errors() };
};

/** AC5 flow: pre-existing ~/.aws files, the fixture workspace and a seeded keychain; starts every AWS / LocalStack session. */
export const runStartSessions = async (
  homeDir: string,
  name: WorkspaceName,
  plaintext: string
): Promise<{ credentials: string; config: string; statuses: Record<string, SessionStatus>; errors: string[] }> => {
  installInitialAwsFiles(homeDir);
  installEncryptedWorkspace(homeDir, plaintext);
  const keychain = new InMemoryKeychain();
  await seedKeychain(keychain);
  const core = createCore(homeDir, keychain);
  const statuses: Record<string, SessionStatus> = {};
  for (const session of sessionsToStart(name)) {
    await core.sessionFactory.getSessionService(session.type).start(session.id);
    statuses[session.id] = core.repository.getSessionById(session.id).status;
  }
  return { credentials: readAwsFile(homeDir, "credentials"), config: readAwsFile(homeDir, "config"), statuses, errors: core.logger.errors() };
};
