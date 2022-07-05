import { jest, describe, test, expect } from "@jest/globals";
import { AwsSsoIntegrationService } from "./aws-sso-integration-service";
import { IntegrationType } from "../../models/integration-type";
import { Session } from "../../models/session";
import { SSO } from "aws-sdk";

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
    const aws1 = {};
    const aws2 = {};
    const azr1 = {};
    const azr2 = {};
    const awsIntegrationSessions = caseAwsIntegrationSessions;
    const repository = {
      getAwsSsoIntegration: jest.fn(() => awsSsoIntegration),
      getAwsSsoIntegrationSessions: jest.fn(() => awsIntegrationSessions),
      updateAwsSsoIntegration: jest.fn(() => {}),
      listAwsSsoIntegrations: jest.fn(() => [aws1, aws2]),
      listAzureIntegrations: jest.fn(() => [azr1, azr2]),
    };
    const behavioralNotifier = {
      setIntegrations: jest.fn(() => {}),
      getSessions: () => [],
      getSessionById: () => ({} as Session),
      setSessions: () => {},
      getIntegrations: () => [],
    };
    const accessToken = "accessToken";
    const getAccessToken = jest.fn(async () => accessToken);
    const sessions = caseSessions;
    const getSessions = jest.fn(async () => sessions);

    const awsSsoIntegrationService = new AwsSsoIntegrationService(repository as any, null, behavioralNotifier as any, null, null, null, null);

    (awsSsoIntegrationService as any).getAccessToken = getAccessToken;
    (awsSsoIntegrationService as any).getSessions = getSessions;

    const sessionDiff = await awsSsoIntegrationService.loginAndGetSessionsDiff(integrationId);

    expect(sessionDiff.sessionsToDelete).toEqual(expectedResults[0]);
    expect(sessionDiff.sessionsToAdd).toEqual(expectedResults[1]);
    expect(repository.getAwsSsoIntegration).toHaveBeenCalledWith(integrationId);
    expect(getAccessToken).toHaveBeenCalledWith(integrationId, awsSsoIntegration.region, awsSsoIntegration.portalUrl);
    expect(getSessions).toHaveBeenCalledWith(integrationId, accessToken, awsSsoIntegration.region);
    expect(repository.getAwsSsoIntegrationSessions).toHaveBeenCalledWith(integrationId);
    expect(behavioralNotifier.setIntegrations).toHaveBeenCalledWith([aws1, aws2, azr1, azr2]);
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
      create: jest.fn(() => {}),
    };
    const sessionService = {
      delete: jest.fn(async () => {}),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    };

    const awsSsoIntegrationService = new AwsSsoIntegrationService(null, null, null, null, sessionFactory as any, null, awsSsoRoleService as any);
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
      type: IntegrationType.awsSso,
    } as any;
    awsIntegrationService.createIntegration(creationParams);

    expect(repository.addAwsSsoIntegration).toHaveBeenCalledWith("portalUrl", "alias", "region", "browserOpening");
  });

  test("deleteIntegration", async () => {
    const expectedSessions = [];

    const repository = {
      deleteAwsSsoIntegration: jest.fn(),
      getSessions: () => expectedSessions,
      deleteSessions: jest.fn(),
    } as any;

    const behavioralNotifier = {
      setSession: () => {},
      getSessions: () => [],
      getSessionById: () => ({} as Session),
      setSessions: () => {},
      getIntegrations: () => [],
      setIntegrations: () => {},
    };
    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, behavioralNotifier, null, null, null, null);

    awsIntegrationService.logout = jest.fn();

    const integrationId = "integrationId";
    await awsIntegrationService.deleteIntegration(integrationId);

    expect(awsIntegrationService.logout).toHaveBeenCalledWith(integrationId);
    expect(repository.deleteAwsSsoIntegration).toHaveBeenCalledWith(integrationId);
  });

  test("updateIntegration", () => {
    const repository = {
      getAwsSsoIntegration: jest.fn(() => ({ isOnline: true })),
      updateAwsSsoIntegration: jest.fn(),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);

    const updateParams = {
      alias: "alias",
      portalUrl: "portalUrl",
      region: "region",
      browserOpening: "browserOpening",
      type: IntegrationType.awsSso,
    } as any;
    awsIntegrationService.updateIntegration("1234", updateParams);

    expect(repository.getAwsSsoIntegration).toHaveBeenCalledWith("1234");
    expect(repository.updateAwsSsoIntegration).toHaveBeenCalledWith("1234", "alias", "region", "portalUrl", "browserOpening", true);
  });

  test("getIntegration", () => {
    const repository = {
      getAwsSsoIntegration: jest.fn(),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);
    awsIntegrationService.getIntegration("1234");

    expect(repository.getAwsSsoIntegration).toHaveBeenCalledWith("1234");
  });

  test("getOnlineIntegrations", () => {
    const repository = {
      listAwsSsoIntegrations: jest.fn(() => [
        { id: 1, isOnline: true },
        { id: 2, isOnline: true },
        { id: 3, isOnline: false },
      ]),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);
    const result = awsIntegrationService.getOnlineIntegrations();

    expect(repository.listAwsSsoIntegrations).toHaveBeenCalled();
    expect(result.length).toBe(2);
    expect(result.map((r) => r.id)).toStrictEqual([1, 2]);
  });

  test("getOfflineIntegrations", () => {
    const repository = {
      listAwsSsoIntegrations: jest.fn(() => [
        { id: 1, isOnline: true },
        { id: 2, isOnline: true },
        { id: 3, isOnline: false },
      ]),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);
    const result = awsIntegrationService.getOfflineIntegrations();

    expect(repository.listAwsSsoIntegrations).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result.map((r) => r.id)).toStrictEqual([3]);
  });

  test("getProtocol", () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    expect((awsIntegrationService as any).getProtocol("https://www.google.test.com")).toBe("https");
    expect((awsIntegrationService as any).getProtocol("http://www.google.test.com")).toBe("http");
  });

  test("deleteDependentSessions", () => {
    const sessions = [
      { sessionId: 1, awsSsoConfigurationId: "2" },
      { sessionId: 2, awsSsoConfigurationId: "2" },
      { sessionId: 3, awsSsoConfigurationId: "1" },
    ];

    const repository = {
      getSessions: jest.fn(() => sessions),
      deleteSession: jest.fn((id) => {
        const session = sessions.find((s) => s.sessionId === id);
        sessions.splice(sessions.indexOf(session), 1);
      }),
    } as any;

    const behaviourNotifier = {
      setSessions: jest.fn(),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, behaviourNotifier, null, null, null, null);
    (awsIntegrationService as any).deleteDependentSessions("2");
    expect(sessions.length).toBe(1);
    expect(sessions[0].sessionId).toBe(3);
    expect(behaviourNotifier.setSessions).toHaveBeenCalledWith([{ sessionId: 3, awsSsoConfigurationId: "1" }]);
  });

  test("findOldSession", () => {
    /*
    *     for (let i = 0; i < this.repository.getSessions().length; i++) {
      const sess = this.repository.getSessions()[i];

      if (sess.type === SessionType.awsSsoRole) {
        if (
          (sess as AwsSsoRoleSession).email === accountInfo.emailAddress &&
          (sess as AwsSsoRoleSession).roleArn === `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`
        ) {
          return { region: (sess as AwsSsoRoleSession).region, profileId: (sess as AwsSsoRoleSession).profileId };
        }
      }
    }

    return undefined;
    * */
    const sessions = [
      { sessionId: 1, awsSsoConfigurationId: "2" },
      { sessionId: 2, awsSsoConfigurationId: "2" },
      { sessionId: 3, awsSsoConfigurationId: "1" },
    ];

    const accountInfo: SSO.AccountInfo = {
      accountId: "testAccountid",
      accountName: "testAccountName",
      emailAddress: "test@gmail.com",
    };

    const accountRole: SSO.RoleInfo = {
      roleName: "",
      accountId: "",
    };

    const repository = {
      getSessions: jest.fn(() => sessions),
      deleteSession: jest.fn((id) => {
        const session = sessions.find((s) => s.sessionId === id);
        sessions.splice(sessions.indexOf(session), 1);
      }),
    } as any;

    const awsIntegrationService = new AwsSsoIntegrationService(repository, null, null, null, null, null, null);
    expect((awsIntegrationService as any).findOldSession(accountInfo, accountRole));
  });

  test("logout", () => {});
});
