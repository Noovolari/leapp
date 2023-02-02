import { TestBed } from "@angular/core/testing";

import { UserService } from "./user.service";
import { User } from "leapp-team-core/user/user";
import { UserProvider } from "leapp-team-core/user/user.provider";
import { LocalStorageService } from "../storage/local-storage.service";
import { HttpClientService } from "../http/http-client.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { of } from "rxjs";

describe("UserService", () => {
  let localStorageService: LocalStorageService;
  let userService: UserService;
  let userProvider: UserProvider;
  let email: string;
  let password: string;

  beforeEach(() => {
    TestBed.configureTestingModule({})
      .overrideProvider(HttpClientService, { useValue: null })
      .overrideProvider(ConfigurationService, { useValue: { apiEndpoint: null } });
    userService = TestBed.inject(UserService);
    localStorageService = TestBed.inject(LocalStorageService);
    userProvider = userService.userProvider;
    email = "giulia@rossi.it";
    password = "trustn01";
  });

  it("Signup", async () => {
    const firstName = "Giulia";
    const lastName = "Rossi";
    const teamName = "FakeTeam";
    const invitationCode = "FakeCode";

    const signUpSpy = spyOn(userProvider, "signUp").and.resolveTo();
    await userService.signUp(firstName, lastName, teamName, email, password, invitationCode);
    expect(signUpSpy).toHaveBeenCalledOnceWith(firstName, lastName, teamName, email, password, invitationCode);
  });

  it("Signin", async () => {
    const expectedUser = new User(
      "userId",
      "firstName",
      "lastName",
      email,
      "mockedRole",
      "mockedTeamName",
      "symmetricKey",
      "privateKey",
      "publicKey",
      "accessToken"
    );

    const signInSpy = spyOn(userProvider, "signIn").and.returnValue(of(expectedUser).toPromise());
    const setItemSpy = spyOn(localStorageService, "setItem").and.stub();

    const actualUser = await userService.signIn(email, password);
    expect(signInSpy.calls.first().args).toEqual([email, password]);
    expect(setItemSpy.calls.first().args).toEqual(["user", expectedUser]);
    expect(actualUser).toEqual(expectedUser);
  });

  it("ActivateAccount", async () => {
    const userId = "userId";
    const activationCode = "activationCode";
    const activateAccountSpy = spyOn(userProvider, "activateAccount").and.resolveTo();

    await userService.activateAccount(userId, activationCode);
    expect(activateAccountSpy.calls.first().args).toEqual([userId, activationCode]);
  });

  it("GetAuthenticationToken - AccessToken available", () => {
    const expectedAccessToken = "accessToken_007";
    const expectedUser = new User("", "", "", "", "", "", "", "", "", expectedAccessToken);
    spyOn(localStorageService, "getItem").and.returnValue(expectedUser);

    const actualToken = userService.getAuthenticationToken();
    expect(actualToken).toEqual(expectedAccessToken);
  });

  it("GetAuthenticationToken - AccessToken not available", () => {
    const localStorageGetSpy = spyOn(localStorageService, "getItem").and.callThrough();
    const actualToken = userService.getAuthenticationToken();
    expect(localStorageGetSpy.calls.first().returnValue).toBeUndefined();
    expect(actualToken).toBeUndefined();
  });

  it("IsSignedIn - User not logged in", () => {
    spyOn(userService, "getAuthenticationToken").and.returnValue(undefined);

    expect(userService.isSignedIn).toBeFalse();
  });

  it("IsSignedIn - User already logged in", () => {
    spyOn(userService, "getAuthenticationToken").and.returnValue("authenticationToken");

    expect(userService.isSignedIn).toBeTrue();
  });

  it("SignOut", () => {
    const localStorageRemoveSpy = spyOn(localStorageService, "removeItem").and.callThrough();

    userService.signOut();
    expect(localStorageRemoveSpy.calls.first().args).toEqual(["user"]);
  });

  it("getUser", () => {
    const localStorageService2 = {
      getItem: () => {},
    };
    const configService = {
      apiEndpoint: "" as any,
    } as any;
    spyOn(localStorageService2, "getItem").and.callThrough();
    const userService2 = new UserService(null as any, configService, null as any);
    (userService2 as any).localStorageService = localStorageService2;
    userService2.getUser();
    expect(localStorageService2.getItem).toHaveBeenCalled();
  });
});
