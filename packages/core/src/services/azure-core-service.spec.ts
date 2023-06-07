import { describe, expect, test } from "@jest/globals";
import { AzureCoreService } from "./azure-core-service";

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
});
