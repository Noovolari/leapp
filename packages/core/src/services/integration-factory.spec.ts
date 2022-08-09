import { describe, test } from "@jest/globals";
import { IntegrationFactory } from "./integration-factory";

describe("IntegrationFactory", () => {
  test("getIdpUrls", () => {
    const factory = new IntegrationFactory(null, null);
    console.log(factory);
  });
});
