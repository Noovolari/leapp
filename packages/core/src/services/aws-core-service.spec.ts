import { describe, test, expect } from "@jest/globals";
import { AwsCoreService } from "./aws-core-service";

describe("awsCoreService", () => {
  test("getRegions", () => {
    const awsCoreService = new AwsCoreService(null, null);

    expect(awsCoreService.getRegions()).toEqual([
      {
        region: "af-south-1",
      },
      {
        region: "ap-east-1",
      },
      {
        region: "ap-northeast-1",
      },
      {
        region: "ap-northeast-2",
      },
      {
        region: "ap-northeast-3",
      },
      {
        region: "ap-south-1",
      },
      {
        region: "ap-southeast-1",
      },
      {
        region: "ap-southeast-2",
      },
      {
        region: "ap-southeast-3",
      },
      {
        region: "ca-central-1",
      },
      {
        region: "cn-north-1",
      },
      {
        region: "cn-northwest-1",
      },
      {
        region: "eu-central-1",
      },
      {
        region: "eu-north-1",
      },
      {
        region: "eu-south-1",
      },
      {
        region: "eu-west-1",
      },
      {
        region: "eu-west-2",
      },
      {
        region: "eu-west-3",
      },
      {
        region: "me-south-1",
      },
      {
        region: "sa-east-1",
      },
      {
        region: "us-east-1",
      },
      {
        region: "us-east-2",
      },
      {
        region: "us-gov-east-1",
      },
      {
        region: "us-gov-west-1",
      },
      {
        region: "us-west-1",
      },
      {
        region: "us-west-2",
      },
    ]);
  });
});
