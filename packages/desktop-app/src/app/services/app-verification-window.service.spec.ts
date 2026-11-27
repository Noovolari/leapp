import { AppVerificationWindowService } from "./app-verification-window.service";
import { constants } from "@noovolari/leapp-core/models/constants";

/** Electron BrowserWindow fake: the boundary the service drives. `close()` emits `close`, as Electron does. */
class FakeBrowserWindow {
  readonly loadedUrls: string[] = [];
  closeCalls = 0;
  destroyed = false;
  readonly webContents = {
    session: {
      webRequest: {
        onCompleted: jasmine.createSpy("onCompleted"),
        onErrorOccurred: jasmine.createSpy("onErrorOccurred"),
      },
    },
  };
  private readonly handlers: { [event: string]: ((event: any) => void)[] } = {};

  loadURL(url: string): void {
    this.loadedUrls.push(url);
  }

  on(event: string, handler: (event: any) => void): void {
    (this.handlers[event] = this.handlers[event] || []).push(handler);
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  close(): void {
    this.closeCalls++;
    this.emitClose();
  }

  /** The user clicks the window's close button. */
  userClose(): void {
    this.emitClose();
  }

  private emitClose(): void {
    (this.handlers.close || []).forEach((handler) => handler({ preventDefault: () => {} }));
    this.destroyed = true;
  }
}

describe("AppVerificationWindowService", () => {
  const verificationUriComplete = "https://device.sso.eu-west-1.amazonaws.com/?user_code=ABCD-EFGH";
  const registerClientResponse: any = { clientId: "client-id", clientSecret: "client-secret" };
  const startDeviceAuthorizationResponse: any = { deviceCode: "device-code", verificationUriComplete };

  let fakeWindow: FakeBrowserWindow;
  let windowService: any;
  let service: AppVerificationWindowService;
  let onWindowClose: jasmine.Spy;

  const stillPendingAfter = (ms: number) => new Promise((resolve) => setTimeout(() => resolve("still pending"), ms));

  beforeEach(() => {
    fakeWindow = new FakeBrowserWindow();
    windowService = {
      newWindow: jasmine.createSpy("newWindow").and.returnValue(fakeWindow),
      getCurrentWindow: () => ({ getPosition: () => [100, 100] }),
      authorizationDialog: jasmine.createSpy("authorizationDialog"),
      openExternalUrl: jasmine.createSpy("openExternalUrl"),
    };
    const toasterService: any = { toast: jasmine.createSpy("toast") };
    service = new AppVerificationWindowService(windowService, toasterService);
    onWindowClose = jasmine.createSpy("onWindowClose");
  });

  it("the In-app window opens on the verification URL and the promise resolves at once with the device-flow ids", async () => {
    const opened = service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inApp, onWindowClose);

    const result = await Promise.race([opened, stillPendingAfter(100)]);

    expect(result).toEqual({ clientId: "client-id", clientSecret: "client-secret", deviceCode: "device-code" });
    expect(windowService.newWindow).toHaveBeenCalledWith(verificationUriComplete, true, "Portal url - Client verification", 300, 150);
    expect(fakeWindow.loadedUrls).toEqual([verificationUriComplete]);
  });

  it("In-browser opens the default browser, resolves at once and Leapp has no window to close", async () => {
    const opened = service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inBrowser, onWindowClose);

    expect(await Promise.race([opened, stillPendingAfter(100)])).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
      deviceCode: "device-code",
    });
    expect(windowService.openExternalUrl).toHaveBeenCalledOnceWith(verificationUriComplete);
    expect(windowService.newWindow).not.toHaveBeenCalled();
    expect(windowService.authorizationDialog).toHaveBeenCalledOnceWith("ABCD-EFGH");

    service.closeVerificationWindow();
    expect(fakeWindow.closeCalls).toBe(0);
    expect(onWindowClose).not.toHaveBeenCalled();
  });

  it("closeVerificationWindow closes the window without calling onWindowClose", async () => {
    service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inApp, onWindowClose).catch(() => {});
    await stillPendingAfter(0);

    (service as any).closeVerificationWindow?.();

    expect(fakeWindow.closeCalls).toBe(1);
    expect(onWindowClose).not.toHaveBeenCalled();
  });

  it("a close by the user calls onWindowClose once", async () => {
    service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inApp, onWindowClose).catch(() => {});
    await stillPendingAfter(0);

    fakeWindow.userClose();

    expect(onWindowClose).toHaveBeenCalledTimes(1);
  });

  it("closeVerificationWindow after the window is gone does nothing", async () => {
    service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inApp, onWindowClose).catch(() => {});
    await stillPendingAfter(0);
    fakeWindow.userClose();

    (service as any).closeVerificationWindow?.();
    (service as any).closeVerificationWindow?.();

    expect(fakeWindow.closeCalls).toBe(0);
    expect(onWindowClose).toHaveBeenCalledTimes(1);
  });

  it("a page load error closes the window and reports the error once through onWindowClose", async () => {
    service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inApp, onWindowClose).catch(() => {});
    await stillPendingAfter(0);
    const reportError = fakeWindow.webContents.session.webRequest.onErrorOccurred.calls.mostRecent().args[0];

    reportError({ error: "net::ERR_NAME_NOT_RESOLVED" });

    expect(fakeWindow.closeCalls).toBe(1);
    expect(onWindowClose).toHaveBeenCalledOnceWith("net::ERR_NAME_NOT_RESOLVED");
  });

  it("an ignored load error (net::ERR_ABORTED) changes nothing", async () => {
    service.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse, constants.inApp, onWindowClose).catch(() => {});
    await stillPendingAfter(0);
    const reportError = fakeWindow.webContents.session.webRequest.onErrorOccurred.calls.mostRecent().args[0];

    reportError({ error: "net::ERR_ABORTED" });

    expect(fakeWindow.closeCalls).toBe(0);
    expect(onWindowClose).not.toHaveBeenCalled();
  });
});
