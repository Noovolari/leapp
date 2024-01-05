import { Injectable } from "@angular/core";
import posthog from "posthog-js";
import { User, Role } from "./team-service";
import { environment } from "../../environments/environment";
import { AppProviderService } from "./app-provider.service";
import { constants } from "@noovolari/leapp-core/models/constants";

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private currentLoggedUser: User | undefined;
  private myPosthog = posthog;

  constructor(private appProviderService: AppProviderService) {
    this.initConfig();
  }

  initConfig(): void {
    try {
      this.myPosthog.init("phc_jfCfo3xkpQHalmoHmyUvx1exA4K4dC9ao2lFc434nxr", {
        ["api_host"]: "https://eu.posthog.com",
        ["capture_pageview"]: false,
        ["capture_pageleave"]: false,
      });
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  init(user: User): void {
    try {
      this.currentLoggedUser = user;
      const createdAt = new Date().toISOString();
      this.captureGroupOnce(user.teamId, user.teamName, createdAt, user.role);
      this.captureUser(user, createdAt);
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  async captureEvent(eventName: string, properties: any = {}, captureAnonymousEvent = false, resetAfterCapture = false): Promise<void> {
    const signedInUser = this.appProviderService.teamService.signedInUserState.getValue();
    const currentWorkspace = await this.appProviderService.teamService.getKeychainCurrentWorkspace();
    if (captureAnonymousEvent || (signedInUser && signedInUser.accessToken !== "" && currentWorkspace !== constants.localWorkspaceKeychainValue)) {
      console.log("EVENT: ", eventName);
      try {
        this.myPosthog.capture(
          eventName,
          Object.assign({ ["leapp_agent"]: "Desktop App", environment: environment.production ? "production" : "development" }, properties)
        );
      } catch (err: any) {
        console.log("PostHog error: " + err.toString());
      }
      if (resetAfterCapture) {
        this.reset();
      }
    }
  }

  captureUser(user: User, createdAt?: string): void {
    try {
      this.myPosthog.identify(
        user.userId,
        Object.assign({ email: user.email }, { role: user.role, firstName: user.firstName, lastName: user.lastName, created: createdAt })
      );
      this.currentLoggedUser = user;
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  captureGroupOnce(companyId: string, companyName: string, _createdAt: string, role: string): void {
    try {
      const plan = role === Role.pro ? "PRO" : "TEAM";
      this.myPosthog.group("company", companyId, { name: companyName, tier: plan });
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  capturePageView(): void {
    try {
      this.myPosthog.capture("$pageview", { ["leapp_agent"]: "Desktop App" });
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  private reset(): void {
    try {
      this.myPosthog.reset();
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }
}
