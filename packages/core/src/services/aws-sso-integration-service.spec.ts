import { jest, describe, test, expect } from "@jest/globals";
import { AwsSsoIntegrationService } from "./aws-sso-integration-service";

describe("AwsSsoIntegrationService", () => {
  test("validateAlias - empty alias", () => {
    const aliasParam = "";
    const actualValidationResult = AwsSsoIntegrationService.validateAlias(aliasParam);

    expect(actualValidationResult).toBe("Empty alias");
  });

  test("validateAlias - only spaces alias", () => {
    const aliasParam = "      ";
    const actualValidationResult = AwsSsoIntegrationService.validateAlias(aliasParam);

    expect(actualValidationResult).toBe("Empty alias");
  });

  test("validateAlias - valid alias", () => {
    const aliasParam = "alias";
    const actualValidationResult = AwsSsoIntegrationService.validateAlias(aliasParam);

    expect(actualValidationResult).toBe(true);
  });

  test("validatePortalUrl - invalid Url", () => {
    const portalUrlParam = "www.url.com";
    const actualValidationPortalUrl = AwsSsoIntegrationService.validatePortalUrl(portalUrlParam);

    expect(actualValidationPortalUrl).toBe("Invalid portal URL");
  });

  test("validatePortalUrl - http Url", () => {
    const portalUrlParam = "http://www.url.com";
    const actualValidationPortalUrl = AwsSsoIntegrationService.validatePortalUrl(portalUrlParam);

    expect(actualValidationPortalUrl).toBe(true);
  });

  test("validatePortalUrl - https Url", () => {
    const portalUrlParam = "https://www.url.com";
    const actualValidationPortalUrl = AwsSsoIntegrationService.validatePortalUrl(portalUrlParam);

    expect(actualValidationPortalUrl).toBe(true);
  });

  test("getIntegrations", () => {
    const expectedIntegrations = [{ id: 1 }];
    const repository = {
      listAwsSsoIntegrations: () => expectedIntegrations,
    } as any;

    const awsIntegrationsService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);

    const integrations = awsIntegrationsService.getIntegrations();

    expect(integrations).toBe(expectedIntegrations);
  });

  test("getOnlineIntegrations", () => {
    const expectedIntegrations = [{ id: 1 }];
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    awsIntegrationsService.getIntegrations = () => expectedIntegrations as any;
    awsIntegrationsService.isOnline = jest.fn(() => true);

    const onlineIntegrations = awsIntegrationsService.getOnlineIntegrations();

    expect(onlineIntegrations).not.toBe(expectedIntegrations);
    expect(onlineIntegrations).toEqual(expectedIntegrations);
    expect(awsIntegrationsService.isOnline).toHaveBeenCalledWith(expectedIntegrations[0]);
  });

  test("getOfflineIntegrations", () => {
    const expectedIntegrations = [{ id: 1 }];
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    awsIntegrationsService.getIntegrations = () => expectedIntegrations as any;
    awsIntegrationsService.isOnline = jest.fn(() => false);

    const offlineIntegrations = awsIntegrationsService.getOfflineIntegrations();

    expect(offlineIntegrations).not.toBe(expectedIntegrations);
    expect(offlineIntegrations).toEqual(expectedIntegrations);
    expect(awsIntegrationsService.isOnline).toHaveBeenCalledWith(expectedIntegrations[0]);
  });

  test("isOnline, token missing", () => {
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    (awsIntegrationsService as any).getDate = () => new Date("2022-02-24T10:00:00");

    const isOnline = awsIntegrationsService.isOnline({} as any);
    expect(isOnline).toBe(false);
  });

  test("isOnline, token expired", () => {
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    (awsIntegrationsService as any).getDate = () => new Date("2022-02-24T10:00:00");

    const integration = {
      accessTokenExpiration: "2022-02-24T10:00:00",
    } as any;

    const isOnline = awsIntegrationsService.isOnline(integration);
    expect(isOnline).toBe(false);
  });

  test("isOnline, token not expired", () => {
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    (awsIntegrationsService as any).getDate = () => new Date("2022-02-24T10:00:00");

    const integration = {
      accessTokenExpiration: "2022-02-24T10:00:01",
    } as any;

    const isOnline = awsIntegrationsService.isOnline(integration);
    expect(isOnline).toBe(true);
  });

  test("remainingHours", () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    const integration = {
      accessTokenExpiration: "2022-02-24T10:30:00",
    } as any;
    (awsIntegrationService as any).getDate = () => new Date("2022-02-24T10:00:00");
    const remainingHours = awsIntegrationService.remainingHours(integration);
    expect(remainingHours).toBe("in 30 minutes");
  });

  const cases = [
    [
      [
        // awsIntegrationSessions
        { sessionName: "sessionName1", roleArn: "roleArn1", email: "email1" },
        { sessionName: "sessionName2", roleArn: "roleArn2", email: "email2" },
      ],
      [
        // sessions
        { sessionName: "sessionName1", roleArn: "roleArn1", email: "email1" },
        { sessionName: "sessionName2", roleArn: "roleArn2", email: "email2" },
      ],
      //expectedResults
      [[], []],
    ],
    [
      [
        // awsIntegrationSessions
        { sessionName: "sessionName1", roleArn: "roleArn1", email: "email1" },
        { sessionName: "sessionName2", roleArn: "roleArn2", email: "email2" },
      ],
      // sessions
      [{ sessionName: "sessionName2", roleArn: "roleArn2", email: "email2" }],
      // expectedResults
      [[{ sessionName: "sessionName1", roleArn: "roleArn1", email: "email1" }], []],
    ],
    [
      // awsIntegrationSessions
      [
        // awsIntegrationSessions
        { sessionName: "sessionName1", roleArn: "roleArn1", email: "email1" },
      ],
      // sessions
      [
        { sessionName: "sessionName1", roleArn: "roleArn1", email: "email1" },
        { sessionName: "sessionName2", roleArn: "roleArn2", email: "email2" },
      ],
      // expectedResults
      [[], [{ sessionName: "sessionName2", roleArn: "roleArn2", email: "email2" }]],
    ],
  ];
  test.each(cases)("loginAndGetSessionsDiff %#", async (caseAwsIntegrationSessions, caseSessions, expectedResults) => {
    const integrationId = "integrationId";
    const awsSsoIntegration = {
      region: "region",
      portalUrl: "portalUrl",
    };
    const awsIntegrationSessions = caseAwsIntegrationSessions;
    const repository = {
      getAwsSsoIntegration: jest.fn(() => awsSsoIntegration),
      getAwsSsoIntegrationSessions: jest.fn(() => awsIntegrationSessions),
    };
    const accessToken = "accessToken";
    const getAccessToken = jest.fn(async () => accessToken);
    const sessions = caseSessions;
    const getSessions = jest.fn(async () => sessions);

    const awsSsoIntegrationService = new AwsSsoIntegrationService(repository as any, null, null, null, null, null, null);
    (awsSsoIntegrationService as any).getAccessToken = getAccessToken;
    (awsSsoIntegrationService as any).getSessions = getSessions;

    const sessionDiff = await awsSsoIntegrationService.loginAndGetSessionsDiff(integrationId);

    expect(sessionDiff.sessionsToDelete).toEqual(expectedResults[0]);
    expect(sessionDiff.sessionsToAdd).toEqual(expectedResults[1]);
    expect(repository.getAwsSsoIntegration).toHaveBeenCalledWith(integrationId);
    expect(getAccessToken).toHaveBeenCalledWith(integrationId, awsSsoIntegration.region, awsSsoIntegration.portalUrl);
    expect(getSessions).toHaveBeenCalledWith(integrationId, accessToken, awsSsoIntegration.region);
    expect(repository.getAwsSsoIntegrationSessions).toHaveBeenCalledWith(integrationId);
  });

  test("syncSessions", async () => {
    const integrationId = "integrationId";
    const sessionDiff = {
      sessionsToDelete: [
        {
          type: "type",
          sessionId: "sessionId",
        },
      ],
      sessionsToAdd: [
        {
          awsSsoConfigurationId: "configurationId",
        },
      ],
    };
    const loginAndGetSessionsDiff = jest.fn(async () => sessionDiff);
    const awsSsoRoleService = {
      create: jest.fn(async () => {}),
    };
    const sessionService = {
      delete: jest.fn(async () => {}),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    };
    const awsSsoIntegrationService = new AwsSsoIntegrationService(null, null, awsSsoRoleService as any, null, null, null, sessionFactory as any);
    (awsSsoIntegrationService as any).loginAndGetSessionsDiff = loginAndGetSessionsDiff;

    const syncedSessions = await awsSsoIntegrationService.syncSessions(integrationId);

    expect(syncedSessions).toEqual(sessionDiff);
    expect(loginAndGetSessionsDiff).toHaveBeenCalledWith(integrationId);
    expect(awsSsoRoleService.create).toHaveBeenCalledWith({
      awsSsoConfigurationId: "integrationId",
    });
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("type");
    expect(sessionService.delete).toHaveBeenCalledWith("sessionId");
  });

  test("getDate", () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    const time: Date = (awsIntegrationService as any).getDate();

    expect(time).toBeInstanceOf(Date);
    expect(time.getDay()).toBe(new Date().getDay());
  });

  test("getIntegrationAccessTokenKey", () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    const integrationId = "integration1";

    const actualIntegrationAccessTokenKey = (awsIntegrationService as any).getIntegrationAccessTokenKey(integrationId);

    expect(actualIntegrationAccessTokenKey).toBe(`aws-sso-integration-access-token-${integrationId}`);
  });

  test("createIntegration", () => {
    const repository = {
      addAwsSsoIntegration: jest.fn(),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);

    const creationParams = {
      alias: "alias",
      portalUrl: "portalUrl",
      region: "region",
      browserOpening: "browserOpening",
    };
    awsIntegrationService.createIntegration(creationParams);

    expect(repository.addAwsSsoIntegration).toHaveBeenCalledWith("portalUrl", "alias", "region", "browserOpening");
  });

  test("deleteIntegration", async () => {
    const repository = {
      deleteAwsSsoIntegration: jest.fn(),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);
    awsIntegrationService.logout = jest.fn();

    const integrationId = "integrationId";
    await awsIntegrationService.deleteIntegration(integrationId);

    expect(awsIntegrationService.logout).toHaveBeenCalledWith(integrationId);
    expect(repository.deleteAwsSsoIntegration).toHaveBeenCalledWith(integrationId);
  });
});
