import { Injectable } from "@angular/core";
import posthog from "posthog-js";
import { User } from "../leapp-team-core/user/user";

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private currentLoggedUser: User | undefined;
  private myPosthog = posthog;

  constructor() {
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
      this.captureGroupOnce(user.teamId, user.teamName, createdAt, "Free Trial");
      this.captureUser(user, createdAt);
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  captureEvent(eventName: string, properties?: any): void {
    console.log("EVENT: ", eventName);
    try {
      this.myPosthog.capture(eventName, Object.assign({ ["leapp_agent"]: "Desktop App" }, properties ?? {}));
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
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

  captureGroupOnce(companyId: string, companyName: string, _createdAt: string, _plan: string): void {
    try {
      this.myPosthog.group("company", companyId, { name: companyName });
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

  reset(): void {
    try {
      this.myPosthog.reset();
    } catch (err: any) {
      console.log("PostHog error: " + err.toString());
    }
  }

  isUserLogged(): boolean {
    return !!this.currentLoggedUser;
  }
}
