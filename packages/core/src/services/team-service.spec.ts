import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { TeamService } from "./team-service";
import { constants } from "../models/constants";
import { SecretType } from "../../../../../leapp-team/packages/leapp-team-core/encryptable-dto/secret-type";
import { SessionType } from "../models/session-type";

describe("TeamService", () => {
  let sessionFactory: any;
  let namedProfileService: any;
  let sessionManagementService: any;
  let awsSsoIntegrationService: any;
  let azureIntegrationService: any;
  let idpUrlService: any;
  let keyChainService: any;
  let nativeService: any;
  let fileService: any;
  let repository: any;
  let workspaceService: any;
  let integrationFactory: any;
  let crypto: any;
  let behaviouralSubjectService: any;

  let teamService;

  const createTeamServiceInstance = () => {
    sessionFactory = {};
    namedProfileService = {};
    sessionManagementService = {};
    awsSsoIntegrationService = {};
    azureIntegrationService = {};
    idpUrlService = {};
    keyChainService = {};
    nativeService = {};
    fileService = {};
    repository = {};
    workspaceService = {};
    integrationFactory = {};
    crypto = {};
    behaviouralSubjectService = {};
    nativeService = {
      os: {
        homedir: () => "",
      },
    };
    teamService = new TeamService(
      sessionFactory,
      namedProfileService,
      sessionManagementService,
      awsSsoIntegrationService,
      azureIntegrationService,
      idpUrlService,
      keyChainService,
      nativeService,
      fileService,
      repository,
      crypto,
      workspaceService,
      integrationFactory,
      behaviouralSubjectService
    );
  };

  test("checkSignedInUser() - token not expired yet", async () => {
    createTeamServiceInstance();
    const mockedKeychainString = `{"key":"value"}`;
    teamService.keyChainService = {
      getSecret: jest.fn(async () => mockedKeychainString),
    } as any;
    teamService.teamSignedInUserKeychainKey = "mocked-keychain";
    teamService.isJwtTokenExpired = jest.fn(() => false);
    teamService.signOut = jest.fn();
    teamService.signedInUser$ = {
      next: jest.fn(),
    };

    const result = await teamService.checkSignedInUser();
    expect(teamService.keyChainService.getSecret).toHaveBeenCalledWith(constants.appName, "mocked-keychain");
    expect(teamService.signOut).not.toHaveBeenCalled();
    expect(teamService.signedInUser$.next).toHaveBeenCalled();
    expect(result).toEqual(true);
  });

  test("checkSignedInUser() - token expired", async () => {
    createTeamServiceInstance();
    const mockedKeychainString = `{"key":"value"}`;
    teamService.keyChainService = {
      getSecret: async () => mockedKeychainString,
    } as any;
    teamService.teamSignedInUserKeychainKey = "mocked-keychain";
    teamService.isJwtTokenExpired = () => true;
    teamService.signOut = jest.fn();
    teamService.signedInUser$ = {
      next: () => {},
    };

    const result = await teamService.checkSignedInUser();
    expect(teamService.signOut).toHaveBeenCalled();
    expect(result).toEqual(true);
  });

  test("checkSignedInUser() - user not present in the keychain", async () => {
    createTeamServiceInstance();
    const mockedKeychainString = null;
    teamService.keyChainService = {
      getSecret: async () => mockedKeychainString,
    } as any;
    teamService.teamSignedInUserKeychainKey = "mocked-keychain";
    teamService.isJwtTokenExpired = () => true;
    teamService.signOut = () => {};
    teamService.signedInUser$ = {
      next: () => {},
    };

    const result = await teamService.checkSignedInUser();
    expect(result).toEqual(false);
  });

  test("signIn()", async () => {
    createTeamServiceInstance();
    teamService.userProvider = {
      signIn: jest.fn(),
    };
    teamService.setSignedInUser = jest.fn();

    await teamService.signIn("mock-email", "mock-password");
    expect(teamService.userProvider.signIn).toHaveBeenCalledWith("mock-email", "mock-password");
    expect(teamService.setSignedInUser).toHaveBeenCalled();
  });

  describe("setSignedInUser()", () => {
    beforeEach(() => {
      createTeamServiceInstance();
      teamService.keyChainService = {
        saveSecret: jest.fn(),
        deleteSecret: jest.fn(),
      };
      teamService.signedInUser$ = {
        next: jest.fn(),
      };
    });

    test("setSignedInUser() - adding the user to the keychain", async () => {
      const mockUser: any = {
        user: "mock-user",
      };
      await teamService.setSignedInUser(mockUser);
      expect(teamService.keyChainService.saveSecret).toHaveBeenCalledWith(constants.appName, "team-signed-in-user", JSON.stringify(mockUser));
      expect(teamService.keyChainService.deleteSecret).not.toHaveBeenCalled();
      expect(teamService.signedInUser$.next).toHaveBeenCalledWith(mockUser);
    });

    test("setSignedInUser() - removing the user to the keychain", async () => {
      const mockUser = undefined;
      await teamService.setSignedInUser(mockUser);
      expect(teamService.keyChainService.saveSecret).not.toHaveBeenCalled();
      expect(teamService.keyChainService.deleteSecret).toHaveBeenCalledWith(constants.appName, "team-signed-in-user");
      expect(teamService.signedInUser$.next).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("TeamService.signOut()", () => {
    beforeEach(() => {
      createTeamServiceInstance();
      teamService.behaviouralSubjectService = {
        sessions: [],
        reloadSessionsAndIntegrationsFromRepository: jest.fn(),
      };
      teamService.sessionFactory = {
        getSessionService: jest.fn(),
      };
      teamService.integrationFactory = {
        getIntegrationService: jest.fn(),
      };
    });
  });

  describe("TeamService.syncSecrets", () => {
    beforeEach(() => {
      createTeamServiceInstance();
    });

    test("if use is not signed in, return", async () => {
      (teamService as any).checkSignedInUser = jest.fn(() => false);
      (teamService as any).isRemoteWorkspace = jest.fn();
      await teamService.syncSecrets();
      expect(teamService.checkSignedInUser).toHaveBeenCalledTimes(1);
      expect(teamService.isRemoteWorkspace).not.toHaveBeenCalled();
    });

    test("if the current workspace is local, expect workspace to be set to remote one", async () => {
      (teamService as any).checkSignedInUser = jest.fn(() => true);
      (teamService as any).isRemoteWorkspace = jest.fn(() => false);
      (teamService as any).setWorkspaceToRemoteOne = jest.fn();
      workspaceService.removeWorkspace = jest.fn();
      workspaceService.createWorkspace = jest.fn();
      workspaceService.reloadWorkspace = jest.fn();
      const mockedRsaKeys = {
        privateKey: "mocked-private-key",
      };
      (teamService as any).getRSAKeys = jest.fn(() => mockedRsaKeys);
      const mockedLocalSecretDtos = [];
      (teamService as any).vaultProvider.getSecrets = jest.fn(() => mockedLocalSecretDtos);
      behaviouralSubjectService.reloadSessionsAndIntegrationsFromRepository = jest.fn();

      await teamService.syncSecrets();

      expect(teamService.setWorkspaceToRemoteOne).toHaveBeenCalledTimes(1);
      expect(workspaceService.removeWorkspace).toHaveBeenCalledTimes(1);
      expect(workspaceService.createWorkspace).toHaveBeenCalledTimes(1);
      expect(workspaceService.reloadWorkspace).toHaveBeenCalledTimes(1);
      expect(behaviouralSubjectService.reloadSessionsAndIntegrationsFromRepository).toHaveBeenCalledTimes(1);
    });

    test("if the returned secrets array contains an integration, expect syncIntegrationSecret to have been called once passing the expected integration dto", async () => {
      (teamService as any).checkSignedInUser = jest.fn(() => true);
      (teamService as any).isRemoteWorkspace = jest.fn(() => false);
      (teamService as any).setWorkspaceToRemoteOne = jest.fn();
      workspaceService.removeWorkspace = jest.fn();
      workspaceService.createWorkspace = jest.fn();
      workspaceService.reloadWorkspace = jest.fn();
      const mockedRsaKeys = {
        privateKey: "mocked-private-key",
      };
      (teamService as any).getRSAKeys = jest.fn(() => mockedRsaKeys);
      const mockedIntegrationDto = { secretType: SecretType.awsSsoIntegration };
      const mockedLocalSecretDtos = [mockedIntegrationDto];
      (teamService as any).vaultProvider.getSecrets = jest.fn(() => mockedLocalSecretDtos);
      (teamService as any).syncIntegrationSecret = jest.fn();
      behaviouralSubjectService.reloadSessionsAndIntegrationsFromRepository = jest.fn();

      await teamService.syncSecrets();

      expect(teamService.syncIntegrationSecret).toHaveBeenCalledTimes(1);
      expect(teamService.syncIntegrationSecret).toHaveBeenCalledWith(mockedIntegrationDto);
    });

    test("if the returned secrets array contains a session, expect syncSessionsSecret to have been called once passing the expected session dto", async () => {
      (teamService as any).checkSignedInUser = jest.fn(() => true);
      (teamService as any).isRemoteWorkspace = jest.fn(() => false);
      (teamService as any).setWorkspaceToRemoteOne = jest.fn();
      workspaceService.removeWorkspace = jest.fn();
      workspaceService.createWorkspace = jest.fn();
      workspaceService.reloadWorkspace = jest.fn();
      const mockedRsaKeys = {
        privateKey: "mocked-private-key",
      };
      (teamService as any).getRSAKeys = jest.fn(() => mockedRsaKeys);
      const mockedSecretDto = { secretType: SecretType.awsIamUserSession };
      const mockedLocalSecretDtos = [mockedSecretDto];
      (teamService as any).vaultProvider.getSecrets = jest.fn(() => mockedLocalSecretDtos);
      (teamService as any).syncSessionsSecret = jest.fn();
      behaviouralSubjectService.reloadSessionsAndIntegrationsFromRepository = jest.fn();

      await teamService.syncSecrets();

      expect(teamService.syncSessionsSecret).toHaveBeenCalledTimes(1);
      expect(teamService.syncSessionsSecret).toHaveBeenCalledWith(mockedSecretDto);
    });
  });

  describe("TeamService.syncSessionsSecret", () => {
    beforeEach(() => {
      createTeamServiceInstance();
    });

    test("if the input secret is an aws iam user session, sessionFactory.getSessionService is called with aws iam user session type and sessionService.create is called with the expected AwsIamUserSessionRequest", async () => {
      const mockedProfileId = "mocked-profile-id";
      const localSecret = {
        secretType: SecretType.awsIamUserSession,
        sessionId: "mocked-session-id",
        profileName: "mocked-profile-name",
        sessionName: "mocked-session-name",
        accessKey: "mocked-access-key",
        secretKey: "mocked-secret-key",
        region: "mocked-region",
        mfaDevice: "mocked-mfa-device",
        profileId: mockedProfileId,
      };
      const mockedSessionService = {
        create: jest.fn(),
      };
      (teamService as any).sessionFactory.getSessionService = jest.fn(() => mockedSessionService);
      (teamService as any).setupAwsSession = jest.fn(() => mockedProfileId);

      await (teamService as any).syncSessionsSecret(localSecret);

      expect(teamService.sessionFactory.getSessionService).toHaveBeenCalledTimes(1);
      expect(teamService.sessionFactory.getSessionService).toHaveBeenCalledWith(SessionType.awsIamUser);
      expect(teamService.setupAwsSession).toHaveBeenCalledTimes(1);
      expect(teamService.setupAwsSession).toHaveBeenCalledWith(mockedSessionService, localSecret.sessionId, localSecret.profileName);
      expect(mockedSessionService.create).toHaveBeenCalledTimes(1);
      expect(mockedSessionService.create).toHaveBeenCalledWith({
        sessionName: localSecret.sessionName,
        accessKey: localSecret.accessKey,
        secretKey: localSecret.secretKey,
        region: localSecret.region,
        mfaDevice: localSecret.mfaDevice,
        profileId: mockedProfileId,
        sessionId: localSecret.sessionId,
      });
    });

    test("if the input secret is an aws iam role chained session, sessionFactory.getSessionService is called with aws iam role chained session type and sessionService.create is called with the expected AwsIamRoleChainedSessionRequest", async () => {
      const mockedProfileId = "mocked-profile-id";
      const mockedParentSessionId = "mocked-parent-session-id";
      const localSecret = {
        secretType: SecretType.awsIamRoleChainedSession,
        sessionId: "mocked-session-id",
        sessionName: "mocked-session-name",
        region: "mocked-region",
        roleArn: "mocked-role-arn",
        profileName: "mocked-profile-name",
        parentSessionId: mockedParentSessionId,
        roleSessionName: "mocked-role-session-name",
      };
      const mockedSessionService = {
        create: jest.fn(),
      };
      (teamService as any).sessionFactory.getSessionService = jest.fn(() => mockedSessionService);
      (teamService as any).setupAwsSession = jest.fn(() => mockedProfileId);
      (teamService as any).getAssumerSessionId = jest.fn(() => mockedParentSessionId);

      await (teamService as any).syncSessionsSecret(localSecret);

      expect(teamService.sessionFactory.getSessionService).toHaveBeenCalledTimes(1);
      expect(teamService.sessionFactory.getSessionService).toHaveBeenCalledWith(SessionType.awsIamRoleChained);
      expect(teamService.setupAwsSession).toHaveBeenCalledTimes(1);
      expect(teamService.setupAwsSession).toHaveBeenCalledWith(mockedSessionService, localSecret.sessionId, localSecret.profileName);
      expect(mockedSessionService.create).toHaveBeenCalledTimes(1);
      expect(mockedSessionService.create).toHaveBeenCalledWith({
        sessionName: localSecret.sessionName,
        region: localSecret.region,
        roleArn: localSecret.roleArn,
        profileId: mockedProfileId,
        parentSessionId: mockedParentSessionId,
        roleSessionName: localSecret.roleSessionName,
        sessionId: localSecret.sessionId,
      });
    });

    test("if the input secret is an aws iam role federated session, sessionFactory.getSessionService is called with aws iam role federated session type and sessionService.create is called with the expected AwsIamRoleFedetatedSessionRequest", async () => {
      const mockedProfileId = "mocked-profile-id";
      const mockedParentSessionId = "mocked-parent-session-id";
      const localSecret = {
        secretType: SecretType.awsIamRoleFederatedSession,
        sessionId: "mocked-session-id",
        sessionName: "mocked-session-name",
        region: "mocked-region",
        roleArn: "mocked-role-arn",
        samlUrl: "mocked-saml-url",
        idpArn: "mocked-idp-arn",
        profileName: "mocked-profile-name",
      };
      const mockedSessionService = {
        create: jest.fn(),
      };
      (teamService as any).sessionFactory.getSessionService = jest.fn(() => mockedSessionService);
      (teamService as any).setupAwsSession = jest.fn(() => mockedProfileId);
      (teamService as any).getAssumerSessionId = jest.fn(() => mockedParentSessionId);
      const mockedIdpUrl = "mocked-idp-url";
      idpUrlService.mergeIdpUrl = jest.fn(() => ({ id: mockedIdpUrl }));

      await (teamService as any).syncSessionsSecret(localSecret);

      expect(teamService.sessionFactory.getSessionService).toHaveBeenCalledTimes(1);
      expect(teamService.sessionFactory.getSessionService).toHaveBeenCalledWith(SessionType.awsIamRoleFederated);
      expect(teamService.setupAwsSession).toHaveBeenCalledTimes(1);
      expect(teamService.setupAwsSession).toHaveBeenCalledWith(mockedSessionService, localSecret.sessionId, localSecret.profileName);
      expect(idpUrlService.mergeIdpUrl).toHaveBeenCalledTimes(1);
      expect(idpUrlService.mergeIdpUrl).toHaveBeenCalledWith(localSecret.samlUrl);
      expect(mockedSessionService.create).toHaveBeenCalledTimes(1);
      expect(mockedSessionService.create).toHaveBeenCalledWith({
        sessionName: localSecret.sessionName,
        region: localSecret.region,
        roleArn: localSecret.roleArn,
        profileId: mockedProfileId,
        idpUrl: mockedIdpUrl,
        idpArn: localSecret.idpArn,
        sessionId: localSecret.sessionId,
      });
    });
  });
});
