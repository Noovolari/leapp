import { Injectable } from "@angular/core";
import { User } from "leapp-team-core/user/user";
import { EncryptionProvider } from "leapp-team-core/encryption/encryption.provider";
import { UserProvider } from "leapp-team-core/user/user.provider";
import { ConfigurationService } from "../configuration/configuration.service";
import { LocalStorageService } from "../storage/local-storage.service";
import { HttpClientService } from "../http/http-client.service";

@Injectable({ providedIn: "root" })
export class UserService {
  public userProvider: UserProvider;

  constructor(httpClientService: HttpClientService, configService: ConfigurationService, private readonly localStorageService: LocalStorageService) {
    this.userProvider = new UserProvider(configService.apiEndpoint, httpClientService, new EncryptionProvider(window.crypto));
  }

  async signUp(firstName: string, lastName: string, teamName: string, email: string, password: string, invitationCode: string): Promise<void> {
    await this.userProvider.signUp(firstName, lastName, teamName, email, password, invitationCode);
  }

  async signIn(email: string, password: string): Promise<User> {
    const user = await this.userProvider.signIn(email, password);
    this.localStorageService.setItem("user", user);
    return user;
  }

  async activateAccount(userId: string, activationCode: string): Promise<void> {
    await this.userProvider.activateAccount(userId, activationCode);
  }

  getAuthenticationToken(): string | undefined {
    return this.localStorageService.getItem<User>("user")?.accessToken;
  }

  getUser(): User | undefined {
    return this.localStorageService.getItem<User>("user");
  }

  public get isSignedIn(): boolean {
    return this.getAuthenticationToken() !== undefined;
  }

  signOut(): void {
    this.localStorageService.removeItem("user");
  }
}
