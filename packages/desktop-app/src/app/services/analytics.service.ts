import { Injectable } from "@angular/core";
import posthog from "posthog-js";
import { User } from "../leapp-team-core/user/user";

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private currentLoggedUser: User | undefined;

  constructor() {
    posthog.init("phc_jfCfo3xkpQHalmoHmyUvx1exA4K4dC9ao2lFc434nxr", {
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

  captureEvent(eventName: string, properties?: any): void {
    posthog.capture(
      eventName,
      Object.assign(
        {
          ["leapp_agent"]: "Desktop App",
          groups: { company: this.currentLoggedUser?.teamId },
        },
        properties ?? {}
      )
    );
  }

  captureUser(user: User, createdAt?: string): void {
    posthog.identify(
      user.userId,
      Object.assign({ email: user.email }, { role: user.role, firstName: user.firstName, lastName: user.lastName, created: createdAt })
    );
    this.currentLoggedUser = user;
  }

  captureGroupOnce(companyId: string, companyName: string, createdAt: string, plan: string): void {
    posthog.group("company", companyId, { name: companyName, plan, created: createdAt });
  }

  capturePageView(): void {
    posthog.capture("$pageview");
  }

  reset() {
    posthog.reset();
  }
}
