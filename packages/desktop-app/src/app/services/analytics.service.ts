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
    this.myPosthog.init("phc_jfCfo3xkpQHalmoHmyUvx1exA4K4dC9ao2lFc434nxr", {
      ["api_host"]: "https://eu.posthog.com",
      ["capture_pageview"]: false,
      ["capture_pageleave"]: false,
    });
  }

  init(user: User): void {
    this.currentLoggedUser = user;
    const createdAt = new Date().toISOString();
    this.captureGroupOnce(user.teamId, user.teamName, createdAt, "Free Trial");
    this.captureUser(user, createdAt);
  }

  captureEvent(eventName: string, user: User, properties?: any): void {
    if (!this.currentLoggedUser || this.currentLoggedUser.userId !== user.userId) {
      this.captureUser(user);
    }
    this.myPosthog.capture(
      eventName,
      Object.assign(
        {
          ["leapp_agent"]: "Portal",
          groups: { company: this.currentLoggedUser?.teamId },
        },
        properties ?? {}
      )
    );
  }

  captureUser(user: User, createdAt?: string): void {
    this.myPosthog.identify(
      user.userId,
      Object.assign({ email: user.email }, { role: user.role, firstName: user.firstName, lastName: user.lastName, created: createdAt })
    );
    this.currentLoggedUser = user;
  }

  captureGroupOnce(companyId: string, companyName: string, createdAt: string, plan: string): void {
    this.myPosthog.group("company", companyId, { name: companyName, plan, created: createdAt });
  }

  capturePageView(): void {
    this.myPosthog.capture("$pageview");
  }

  reset(): void {
    this.myPosthog.reset();
  }
}
