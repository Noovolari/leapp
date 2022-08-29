import { describe, test, jest, expect } from "@jest/globals";
import { AwsCredentialsPlugin } from "./aws-credentials-plugin";

describe("Aws Credentials Plugin", () => {
  test("run", async () => {
    const pluginEnvironment = {
      generateCredentials: jest.fn(() => "fake-credentials"),
    } as any;
    const awsCredPlugin: any = new (AwsCredentialsPlugin as any)(pluginEnvironment);
    awsCredPlugin.applySessionAction = jest.fn();
    await awsCredPlugin.run("fake-session" as any);
    expect(pluginEnvironment.generateCredentials).toHaveBeenCalledWith("fake-session");
    expect(awsCredPlugin.applySessionAction).toHaveBeenCalledWith("fake-session", "fake-credentials");
  });

  test("actionIcon", async () => {
    const awsCredPlugin: any = new (AwsCredentialsPlugin as any)(null);
    awsCredPlugin.metadata = { icon: "fake-icon" };
    const actionIcon = awsCredPlugin.actionIcon;
    expect(actionIcon).toStrictEqual("fake-icon");
  });
});
