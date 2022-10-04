import { expect, describe, test, jest } from "@jest/globals";
import { NamedProfilesService } from "./named-profiles-service";
import { SessionStatus } from "../models/session-status";
import { constants } from "../models/constants";
import { AwsNamedProfile } from "../models/aws/aws-named-profile";
import { AwsSessionService } from "./session/aws/aws-session-service";
import { LoggedException, LogLevel } from "./log-service";

describe("NamedProfilesService", () => {
  test("getNamedProfiles", () => {
    const repository = {
      getProfiles: () => [{ id: "profile1" }, { id: "defaultId" }],
    };
    const namedProfileService = new NamedProfilesService(null, repository as any, null);
    const namedProfiles = namedProfileService.getNamedProfiles();

    expect(namedProfiles).toEqual([{ id: "profile1" }, { id: "defaultId" }]);
  });

  test("getNamedProfiles, excludingDefault", () => {
    const repository = {
      getDefaultProfileId: () => "defaultId",
      getProfiles: () => [{ id: "profile1" }, { id: "defaultId" }, { id: "profile2" }],
    };
    const namedProfileService = new NamedProfilesService(null, repository as any, null);
    const namedProfiles = namedProfileService.getNamedProfiles(true);

    expect(namedProfiles).toEqual([{ id: "profile1" }, { id: "profile2" }]);
  });

  test("getNamedProfilesMap", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    namedProfileService.getNamedProfiles = () => [
      { id: "1", name: "profile1" },
      { id: "2", name: "profile2" },
    ];

    const namedProfilesMap = namedProfileService.getNamedProfilesMap();

    expect(namedProfilesMap).toEqual(
      new Map([
        ["1", { id: "1", name: "profile1" }],
        ["2", { id: "2", name: "profile2" }],
      ])
    );
  });

  test("getProfileIdByName, success", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    const namedProfiles = [
      { name: "fake-profile-name", id: "1" },
      { name: "another-named-profile", id: "2" },
    ];
    namedProfileService.getNamedProfiles = jest.fn(() => namedProfiles);
    const result = namedProfileService.getProfileIdByName("fake-profile-name");
    expect(namedProfileService.getNamedProfiles).toHaveBeenCalled();
    expect(result).toEqual("1");
  });

  test("getProfileIdByName, creates a new profile", () => {
    const newId = "newId";
    const namedProfileService = new NamedProfilesService(null, null, null);
    (namedProfileService as any).createNamedProfile = jest.fn(() => ({ id: newId }));
    const namedProfiles = [{ name: "another-named-profile", id: "2" }];
    namedProfileService.getNamedProfiles = () => namedProfiles;
    const result = namedProfileService.getProfileIdByName("new-profile-name");
    expect(namedProfileService.createNamedProfile).toHaveBeenCalledWith("new-profile-name");
    expect(result).toEqual(newId);
  });

  test("getSessionsWithNamedProfile", () => {
    const repository = {
      getSessions: () => [{ profileId: "1" }, { profileId: "2" }],
    };
    const namedProfileService = new NamedProfilesService(null, repository as any, null);
    const sessions = namedProfileService.getSessionsWithNamedProfile("2");

    expect(sessions).toEqual([{ profileId: "2" }]);
  });

  test("createNamedProfile", () => {
    const repository = {
      addProfile: jest.fn(),
    };
    const namedProfileService = new NamedProfilesService(null, repository as any, null);
    namedProfileService.getNewId = () => "newId";

    namedProfileService.createNamedProfile("newName");

    expect(repository.addProfile).toHaveBeenCalledWith(new AwsNamedProfile("newId", "newName"));
  });

  test("editNamedProfile", async () => {
    let sessionIsRunning = true;
    const sessionService = {
      stop: jest.fn(async () => (sessionIsRunning = false)),
      start: jest.fn(async () => (sessionIsRunning = true)),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    };
    const repository = {
      updateProfile: jest.fn(() => {
        expect(sessionIsRunning).toBe(false);
      }),
    };
    const namedProfileService = new NamedProfilesService(sessionFactory as any, repository as any, null);
    namedProfileService.getSessionsWithNamedProfile = jest.fn(() => [
      { sessionId: "1", status: SessionStatus.pending, type: "type1" },
      { sessionId: "2", status: SessionStatus.inactive, type: "type2" },
      { sessionId: "3", status: SessionStatus.active, type: "type3" },
    ]) as any;

    await namedProfileService.editNamedProfile("profileId", "newName");

    expect(sessionIsRunning).toBe(true);
    expect(namedProfileService.getSessionsWithNamedProfile).toHaveBeenCalledWith("profileId");
    expect(sessionFactory.getSessionService).toBeCalledTimes(2);
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("type3");
    expect(repository.updateProfile).toHaveBeenCalledWith("profileId", "newName");
    expect(sessionService.stop).toHaveBeenCalledWith("3");
    expect(sessionService.start).toHaveBeenCalledWith("3");
  });

  test("deleteNamedProfile", async () => {
    let sessionIsRunning = true;
    const sessionService = {
      stop: jest.fn(async () => (sessionIsRunning = false)),
      start: jest.fn(async () => (sessionIsRunning = true)),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    };
    const behaviouralSubjectService = {
      setSessions: jest.fn(),
    };

    const sessions = [
      { sessionId: "1", status: SessionStatus.pending, type: "type1" },
      { sessionId: "2", status: SessionStatus.inactive, type: "type2" },
      { sessionId: "3", status: SessionStatus.active, type: "type3" },
    ];
    const repository = {
      getDefaultProfileId: () => "defaultProfileId",
      getSessions: jest.fn(() => sessions),
      updateSession: jest.fn((sessionId, session) => {
        expect((session as any).profileId).toBe("defaultProfileId");
        expect(sessionId === "3" && sessionIsRunning).toBe(false);
      }),
      removeProfile: jest.fn(),
    };

    const namedProfileService = new NamedProfilesService(sessionFactory as any, repository as any, behaviouralSubjectService as any);
    namedProfileService.getSessionsWithNamedProfile = jest.fn(() => sessions) as any;

    await namedProfileService.deleteNamedProfile("profileId");

    expect(sessionIsRunning).toBe(true);
    expect(sessionFactory.getSessionService).toHaveBeenNthCalledWith(1, "type1");
    expect(sessionFactory.getSessionService).toHaveBeenNthCalledWith(2, "type2");
    expect(sessionFactory.getSessionService).toHaveBeenNthCalledWith(3, "type3");
    expect(sessionService.stop).toHaveBeenCalledWith("3");
    expect(repository.updateSession).toHaveBeenCalledWith("1", sessions[0]);
    expect(repository.updateSession).toHaveBeenCalledWith("2", sessions[1]);
    expect(repository.updateSession).toHaveBeenCalledWith("3", sessions[2]);
    expect(behaviouralSubjectService.setSessions).toHaveBeenCalledTimes(3);
    expect(sessionService.start).toHaveBeenCalledWith("3");
    expect(repository.removeProfile).toHaveBeenCalledWith("profileId");
  });

  test("changeNamedProfile - AwsSessionService type, active", async () => {
    const session = {
      sessionId: "sessionId",
      status: SessionStatus.active,
      type: "type",
      profileId: "profileId",
    } as any;
    const sessionService = new (AwsSessionService as any)(null, null);
    sessionService.start = jest.fn();
    sessionService.stop = jest.fn();
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    } as any;
    const repository = {
      updateSession: jest.fn(),
      getSessions: jest.fn(),
    } as any;
    const behaviouralSubjectService = {
      setSessions: jest.fn(),
    } as any;

    const namedProfileService = new NamedProfilesService(sessionFactory, repository, behaviouralSubjectService);

    await namedProfileService.changeNamedProfile(session, "newProfileId");

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.stop).toHaveBeenCalledWith(session.sessionId);
    expect(repository.updateSession).toHaveBeenCalledWith(session.sessionId, session);
    expect(behaviouralSubjectService.setSessions).toHaveBeenCalled();
    expect(sessionService.start).toHaveBeenCalledWith(session.sessionId);
  });

  test("changeNamedProfile - AwsSessionService type, inactive", async () => {
    const session = {
      sessionId: "sessionId",
      status: SessionStatus.inactive,
      type: "type",
      profileId: "profileId",
    } as any;
    const sessionService = new (AwsSessionService as any)(null, null, null, null);
    sessionService.start = jest.fn();
    sessionService.stop = jest.fn();
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    } as any;
    const repository = {
      updateSession: jest.fn(),
      getSessions: jest.fn(() => [session]),
    } as any;
    const behaviouralSubjectService = {
      setSessions: jest.fn(),
    } as any;

    const namedProfileService = new NamedProfilesService(sessionFactory, repository, behaviouralSubjectService);

    await namedProfileService.changeNamedProfile(session, "newProfileId");

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.stop).toHaveBeenCalledTimes(0);
    expect(repository.updateSession).toHaveBeenCalledWith(session.sessionId, session);
    expect(behaviouralSubjectService.setSessions).toHaveBeenCalled();
    expect(sessionService.start).toHaveBeenCalledTimes(0);
  });

  test("changeNamedProfile - not AwsSessionService type", async () => {
    const session = {
      sessionId: "sessionId",
      status: SessionStatus.active,
      type: "type",
      profileId: "profileId",
    } as any;
    const sessionService = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    } as any;
    const repository = {
      updateSession: jest.fn(),
    } as any;
    const behaviouralSubjectService = {
      updateSession: jest.fn(),
    } as any;

    const namedProfileService = new NamedProfilesService(sessionFactory, repository, behaviouralSubjectService);

    await namedProfileService.changeNamedProfile(session, "newProfileId");

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.stop).toHaveBeenCalledTimes(0);
    expect(repository.updateSession).toHaveBeenCalledTimes(0);
    expect(behaviouralSubjectService.updateSession).toHaveBeenCalledTimes(0);
    expect(sessionService.start).toHaveBeenCalledTimes(0);
  });

  test("getNewId", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    const id1 = namedProfileService.getNewId();
    const id2 = namedProfileService.getNewId();
    expect(id1).not.toEqual(id2);
  });

  test("validateNewProfileName", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    namedProfileService.getNamedProfiles = () => [];

    expect(namedProfileService.validateNewProfileName("profile")).toBe(true);
  });

  test("validateNewProfileName - valid name with spaces", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    namedProfileService.getNamedProfiles = () => [];

    expect(namedProfileService.validateNewProfileName("   profile   ")).toBe(true);
  });

  test("validateNewProfileName, empty name", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    const emptyNewProfileName = namedProfileService.validateNewProfileName("  ");

    expect(emptyNewProfileName).toBe("Empty profile name");
  });

  test("validateNewProfileName, default name", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    const defaultNewProfileName = namedProfileService.validateNewProfileName(constants.defaultAwsProfileName);

    expect(defaultNewProfileName).toBe('"default" is not a valid profile name');
  });

  test("validateNewProfileName, existent name", () => {
    const namedProfileService = new NamedProfilesService(null, null, null);
    namedProfileService.getNamedProfiles = () => [{ id: "1", name: "profile" }];
    const existentNewProfileName = namedProfileService.validateNewProfileName("profile");

    expect(existentNewProfileName).toBe("Profile already exists");
  });

  test("getProfileName", () => {
    const profiles = [
      { id: "1", name: "10" },
      { id: "2", name: "20" },
      { id: "3", name: "30" },
    ];
    const repository = {
      getProfileName: jest.fn((_id) => {
        const name = profiles.find((p) => p.id === _id)?.name;
        if (name) {
          return name;
        } else {
          throw new LoggedException(`named profile with id ${_id} not found.`, this, LogLevel.warn);
        }
      }),
    } as any;
    const namedProfileService = new NamedProfilesService(null, repository, null);
    expect(namedProfileService.getProfileName("1")).toBe("10");
    expect(namedProfileService.getProfileName("2")).toBe("20");
    expect(namedProfileService.getProfileName("3")).toBe("30");
    expect(() => namedProfileService.getProfileName("4")).toThrow(new LoggedException(`named profile with id 4 not found.`, this, LogLevel.warn));
    expect(repository.getProfileName).toHaveBeenCalled();
  });

  test("getDefaultProfileId", () => {
    const profiles = [
      { id: "1", name: "10" },
      { id: "2", name: "default" },
      { id: "3", name: "30" },
    ];
    const repository = {
      getDefaultProfileId: jest.fn(() => {
        const name = profiles.find((p) => p.name === "default")?.id;
        if (name) {
          return name;
        } else {
          throw new LoggedException(`no default named profile found.`, this, LogLevel.warn);
        }
      }),
    } as any;
    const namedProfileService = new NamedProfilesService(null, repository, null);
    expect(namedProfileService.getDefaultProfileId()).toBe("2");

    profiles.splice(1, 1);
    expect(() => namedProfileService.getDefaultProfileId()).toThrow(new LoggedException(`no default named profile found.`, this, LogLevel.warn));
    expect(repository.getDefaultProfileId).toHaveBeenCalled();
  });
});
