import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { TeamService } from "./team-service";
import { constants } from "../models/constants";

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
});
