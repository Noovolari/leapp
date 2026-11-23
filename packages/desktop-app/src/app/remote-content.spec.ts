// Remote-content windows run sandboxed, openExternal opens only https and mailto
// links, and names interpolated into dialog HTML are shown as text. The real services and components run against
// recording doubles of the Electron and modal boundaries; dialog HTML goes through Angular's own [innerHTML]
// sanitiser, which keeps <a href> and <img src> (the reason escaping is needed).
import { SecurityContext } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { LoggedException } from "@noovolari/leapp-core/services/log-service";
import { WindowService } from "./services/window.service";
import { SelectedSessionActionsService } from "./services/selected-session-actions.service";
import { AppMfaCodePromptService } from "./services/app-mfa-code-prompt.service";
import { OptionsDialogComponent } from "./components/dialogs/options-dialog/options-dialog.component";
import { configure, RecordingModalService } from "./testing/dialog-test-kit";

const HOSTILE = '<img src="https://tracker.example/x.png"><a href="https://evil.example/">click</a>';

/** What [innerHTML] puts in the DOM for `html`: Angular's sanitiser, then the browser's parser. */
const rendered = (html: string): HTMLElement => {
  const sanitizer = TestBed.inject(DomSanitizer);
  const element = document.createElement("div");
  element.innerHTML = sanitizer.sanitize(SecurityContext.HTML, html) ?? "";
  return element;
};

const expectShownAsText = (html: string): void => {
  const element = rendered(html);
  expect(element.querySelectorAll("a, img").length).withContext(html).toBe(0);
  expect(element.textContent).toContain(HOSTILE);
};

class RecordingWindowService {
  messages: string[] = [];
  confirmDialog(message: string): void {
    this.messages.push(message);
  }
  openExternalUrl(): void {}
}

class FakeBrowserWindow {
  static created: any[] = [];
  constructor(public options: any) {
    FakeBrowserWindow.created.push(options);
  }
  setMenuBarVisibility(): void {}
  removeMenu(): void {}
  setMenu(): void {}
  close(): void {}
}

const electronDouble = (): any => {
  const opened: string[] = [];
  return {
    opened,
    browserWindow: FakeBrowserWindow,
    os: { platform: () => "linux" },
    menu: { setApplicationMenu: () => {} },
    shell: { openExternal: async (url: string) => opened.push(url) },
  };
};

describe("remote content: WindowService", () => {
  beforeEach(() => (FakeBrowserWindow.created = []));

  it("windows for remote pages are created sandboxed, without Node and with context isolation", () => {
    const service = new WindowService({} as any, electronDouble(), { logService: { log: () => {} } } as any);
    service.newWindow("https://idp.example/saml", true, "Login");
    const webPreferences = FakeBrowserWindow.created[0].webPreferences;
    expect(webPreferences.nodeIntegration).toBe(false);
    expect(webPreferences.contextIsolation).toBe(true);
    expect(webPreferences.sandbox).toBe(true);
    expect("worldSafeExecuteJavaScript" in webPreferences).toBe(false);
  });

  it("https and mailto links are opened", () => {
    const electron = electronDouble();
    const service = new WindowService({} as any, electron, { logService: { log: () => {} } } as any);
    service.openExternalUrl("https://docs.leapp.cloud/");
    service.openExternalUrl("mailto:support@example.com");
    expect(electron.opened).toEqual(["https://docs.leapp.cloud/", "mailto:support@example.com"]);
  });

  for (const url of ["file:///etc/passwd", "javascript:alert(1)", "smb://host/share", "not a url"]) {
    it(`${url.split(":")[0]} links are refused and nothing is opened`, () => {
      const electron = electronDouble();
      const service = new WindowService({} as any, electron, { logService: { log: () => {} } } as any);
      expect(() => service.openExternalUrl(url)).toThrowMatching(
        (error) => error instanceof LoggedException && error.message === "Leapp can only open https and mailto links"
      );
      expect(electron.opened).toEqual([]);
    });
  }
});

describe("remote content: dialog messages", () => {
  it("deleting a named profile lists its sessions as text", async () => {
    const windowService = new RecordingWindowService();
    const harness = await configure(OptionsDialogComponent, {
      windowService,
      before: (core) => {
        core.workspace.profiles = [...core.workspace.profiles, { id: "p-qa", name: "qa" }];
        core.workspace.sessions = [{ sessionId: "s1", sessionName: HOSTILE, type: SessionType.awsSsoRole, profileId: "p-qa" } as any];
      },
    });
    harness.component.deleteAwsProfile("p-qa");
    expect(windowService.messages.length).toBe(1);
    expectShownAsText(windowService.messages[0]);
  });

  it("deleting an IdP URL lists its federated sessions and role names as text", async () => {
    const windowService = new RecordingWindowService();
    const harness = await configure(OptionsDialogComponent, {
      windowService,
      before: (core) => {
        (core.idpUrlService as any).getDependantSessions = () => [
          { sessionId: "s1", sessionName: HOSTILE, roleArn: "arn:aws:iam::123456789012:role/<b>admin</b>" },
        ];
      },
    });
    harness.component.deleteIdpUrl("idp-1");
    expect(windowService.messages.length).toBe(1);
    expectShownAsText(windowService.messages[0]);
    expect(rendered(windowService.messages[0]).querySelectorAll("b b").length).toBe(0);
  });

  const sessionActions = (windowService: RecordingWindowService, dependants: any[]): SelectedSessionActionsService => {
    const appProvider = {
      sessionFactory: { getSessionService: () => ({ getDependantSessions: () => dependants }) },
      logService: { log: () => {} },
      behaviouralSubjectService: { unselectSessions: () => {} },
    };
    return new SelectedSessionActionsService(appProvider as any, {} as any, windowService as any, {} as any, {} as any, {} as any, {} as any);
  };

  it("deleting a session with dependants lists them as text", async () => {
    const windowService = new RecordingWindowService();
    await sessionActions(windowService, [{ sessionId: "c1", sessionName: HOSTILE }]).deleteSession({
      sessionId: "s1",
      sessionName: "parent",
      type: SessionType.awsIamUser,
    } as any);
    expectShownAsText(windowService.messages[0]);
  });

  it("deleting a session without dependants names it as text", async () => {
    const windowService = new RecordingWindowService();
    await sessionActions(windowService, []).deleteSession({ sessionId: "s1", sessionName: HOSTILE, type: SessionType.awsSsoRole } as any);
    expectShownAsText(windowService.messages[0]);
  });

  it("the MFA prompt names the session as text; the OS notification keeps the plain name", () => {
    const modal = new RecordingModalService();
    const notifications: string[] = [];
    const electron = {
      currentWindow: { show: () => {} },
      notification: class {
        constructor(options: { body: string }) {
          notifications.push(options.body);
        }
        show(): void {}
      },
    };
    (modal as any).getModalsCount = () => 0;
    // the Electron renderer (nodeIntegration) defines __dirname; Karma's browser does not
    (window as any).__dirname = "/qa";
    new AppMfaCodePromptService(modal as any, electron as any).promptForMFACode(HOSTILE, () => {});
    expectShownAsText(modal.shown[0].options.initialState.message);
    expect(notifications[0]).toContain(HOSTILE);
  });
});
