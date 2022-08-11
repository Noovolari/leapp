import { describe, expect, jest, test } from "@jest/globals";
import { AzureCoreService } from "./azure-core-service";
import { AzureSession } from "../models/azure/azure-session";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { AzureSessionService } from "./session/azure/azure-session-service";

describe("azureCoreService", () => {
  test("getLocations", () => {
    const azureCoreService = new AzureCoreService(null, null);

    expect(azureCoreService.getLocations()).toEqual([
      {
        location: "eastus",
      },
      {
        location: "eastus2",
      },
      {
        location: "southcentralus",
      },
      {
        location: "australiaeast",
      },
      {
        location: "southeastasia",
      },
      {
        location: "northeurope",
      },
      {
        location: "uksouth",
      },
      {
        location: "westeurope",
      },
      {
        location: "centralus",
      },
      {
        location: "northcentralus",
      },
      {
        location: "southafricanorth",
      },
      {
        location: "centralindia",
      },
      {
        location: "eastasia",
      },
      {
        location: "japaneast",
      },
      {
        location: "koreacentral",
      },
      {
        location: "canadacentral",
      },
      {
        location: "francecentral",
      },
      {
        location: "germanywestcentral",
      },
      {
        location: "norwayeast",
      },
      {
        location: "switzerlandnorth",
      },
      {
        location: "uaenorth",
      },
      {
        location: "brazilsouth",
      },
      {
        location: "centralusstage",
      },
      {
        location: "eastusstage",
      },
      {
        location: "eastus2stage",
      },
      {
        location: "northcentralusstage",
      },
      {
        location: "southcentralusstage",
      },
      {
        location: "westusstage",
      },
      {
        location: "westus2stage",
      },
      {
        location: "asia",
      },
      {
        location: "asiapacific",
      },
      {
        location: "australia",
      },
      {
        location: "brazil",
      },
      {
        location: "canada",
      },
      {
        location: "europe",
      },
      {
        location: "global",
      },
      {
        location: "india",
      },
      {
        location: "japan",
      },
      {
        location: "uk",
      },
      {
        location: "unitedstates",
      },
      {
        location: "eastasiastage",
      },
      {
        location: "southeastasiastage",
      },
      {
        location: "centraluseuap",
      },
      {
        location: "eastus2euap",
      },
      {
        location: "westcentralus",
      },
      {
        location: "westus3",
      },
      {
        location: "southafricawest",
      },
      {
        location: "australiacentral",
      },
      {
        location: "australiacentral2",
      },
      {
        location: "australiasoutheast",
      },
      {
        location: "japanwest",
      },
      {
        location: "koreasouth",
      },
      {
        location: "southindia",
      },
      {
        location: "westindia",
      },
      {
        location: "canadaeast",
      },
      {
        location: "francesouth",
      },
      {
        location: "germanynorth",
      },
      {
        location: "norwaywest",
      },
      {
        location: "switzerlandwest",
      },
      {
        location: "ukwest",
      },
      {
        location: "uaecentral",
      },
      {
        location: "brazilsoutheast",
      },
    ]);
  });

  test("stopAllSessionsOnQuit", async () => {
    const sessionId = "fakeSessionId";

    const logService = {
      log: jest.fn(() => {}),
    } as any;

    const azureSession: AzureSession = {
      sessionName: "fakeSessionName",
      region: "fakeRegion",
      startDateTime: "fakeStartDateTime ",
      azureIntegrationId: "fakeIntegrationId",
      sessionId,
      sessionTokenExpiration: "fakeTokenExpiration",
      status: SessionStatus.active,
      subscriptionId: "fakeSubscriptionId",
      tenantId: "fakeTenantId",
      type: SessionType.azure,
      expired: () => false,
    };

    const executeService = {
      execute: () => {},
    } as any;

    const repository = {
      getSessions: () => [azureSession],
      getSessionById: () => azureSession,
      updateAzureIntegration: () => {},
      getAzureIntegration: () => {},
      updateSessions: () => {},
    } as any;

    const azurePersistenceService = {
      loadProfile: () => ({
        subscriptions: [],
      }),
      saveProfile: () => {},
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, azurePersistenceService, logService);

    const sessionManagementService = {
      getSessions: jest.fn(() => [azureSession]),
    } as any;

    const spySessionDeactivated = jest.spyOn(azureSessionService, "sessionDeactivated");
    const spyStop = jest.spyOn(azureSessionService, "stop");
    const azureCoreService = new AzureCoreService(sessionManagementService, azureSessionService);

    await azureCoreService.stopAllSessionsOnQuit();
    expect(sessionManagementService.getSessions).toHaveBeenCalledTimes(1);
    expect(sessionManagementService.getSessions).toHaveReturnedWith([azureSession]);
    expect(spySessionDeactivated).toHaveBeenCalledWith(sessionId);
    expect(spyStop).toHaveBeenCalledWith(sessionId);
    expect(azureSession.status).toBe(SessionStatus.inactive);
  });
});
