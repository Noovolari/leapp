import ListSessions from "./list";
import { ux } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";
import { AwsIamUserSession } from "@noovolari/leapp-core/models/aws/aws-iam-user-session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("ListSessions", () => {
  const getTestCommand = (cliProviderService: any = null): ListSessions => {
    const command = new ListSessions([], {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run", async () => {
    const command = getTestCommand();
    command.showSessions = jest.fn();
    await command.run();

    expect(command.showSessions).toHaveBeenCalled();
  });

  test("run - showSessions throw an error", async () => {
    const command = getTestCommand();
    command.showSessions = jest.fn(async () => {
      throw Error("error");
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("error"));
    }
  });

  test("run - showSessions throw an object", async () => {
    const command = getTestCommand();
    const strError = "string";
    command.showSessions = jest.fn(async () => {
      throw strError;
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("Unknown error: string"));
    }
  });

  test("showSessions", async () => {
    const sessions = [new AwsIamUserSession("sessionName", "region", "profileId")];
    const namedProfileMap = new Map([["profileId", { id: "profileId", name: "profileName" }]]);
    const sessionTypeMap = new Map([[SessionType.awsIamUser, "sessionTypeLabel"]]);
    const cliProviderService = {
      sessionManagementService: {
        getSessions: () => sessions,
      },
      cloudProviderService: {
        getSessionTypeMap: () => sessionTypeMap,
      },
      namedProfilesService: {
        getNamedProfilesMap: () => namedProfileMap,
      },
    };

    const command = getTestCommand(cliProviderService);
    const tableSpy = jest.spyOn(ux, "table").mockImplementation(() => null);

    await command.showSessions();
    expect(tableSpy.mock.calls[0][0]).toEqual([
      {
        id: sessions[0].sessionId,
        profileId: "profileName",
        region: "region",
        sessionName: "sessionName",
        role: (command as any).getRole(sessions[0]),
        status: "inactive",
        type: "sessionTypeLabel",
      },
    ]);
    expect(tableSpy.mock.calls[0][1]).toEqual({
      id: { header: "ID", extended: true },
      sessionName: { header: "Session Name" },
      type: { header: "Type" },
      profileId: { header: "Named Profile" },
      region: { header: "Region/Location" },
      role: { header: "Role", extended: true },
      status: { header: "Status" },
    });
  });
});
