import { TestBed } from "@angular/core/testing";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { ExtensionWebsocketService, FetchingState } from "./extension-websocket.service";
import { AppNativeService } from "./app-native.service";
import { AppProviderService } from "./app-provider.service";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";
import { WindowService } from "./window.service";

// The Multi-Console WebSocket listens only on loopback and only
// while the option is on. The `ws` library is the boundary: a fake WebSocketServer records where it listens.

class FakeClient {
  readyState = 1;
  sent: string[] = [];
  closedWith: number;
  on(): void {}
  send(payload: string): void {
    this.sent.push(payload);
  }
  close(code: number): void {
    this.closedWith = code;
    this.readyState = 3;
  }
}

class FakeWebSocketServer {
  static created: FakeWebSocketServer[] = [];
  static failures = new Map<string, string>();
  clients = new Set<FakeClient>();
  closed = false;
  private handlers = new Map<string, ((...args: any[]) => void)[]>();

  constructor(public options: { host: string; port: number }) {
    FakeWebSocketServer.created.push(this);
    const failure = FakeWebSocketServer.failures.get(options.host);
    setTimeout(() => {
      if (failure) {
        this.emit("error", Object.assign(new Error(`listen ${failure}`), { code: failure }));
      } else {
        this.emit("listening");
      }
    });
  }
  on(event: string, handler: (...args: any[]) => void): this {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }
  emit(event: string, ...args: any[]): void {
    (this.handlers.get(event) ?? []).forEach((handler) => handler(...args));
  }
  connect(): FakeClient {
    const client = new FakeClient();
    this.clients.add(client);
    this.emit("connection", client, { headers: {} });
    return client;
  }
  close(callback?: () => void): void {
    this.closed = true;
    callback?.();
  }
}

describe("Multi-Console WebSocket on loopback only", () => {
  let service: ExtensionWebsocketService;
  let workspace: Workspace;
  let toasts: { message: string; level: ToastLevel }[];
  let savedFlavor: string;

  const listening = (): { host: string; port: number }[] =>
    FakeWebSocketServer.created.filter((server) => !server.closed).map((server) => server.options);
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  beforeEach(() => {
    savedFlavor = process.env.LEAPP_FLAVOR;
    delete process.env.LEAPP_FLAVOR;
    FakeWebSocketServer.created = [];
    FakeWebSocketServer.failures = new Map();
    workspace = new Workspace();
    toasts = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: AppNativeService, useValue: { ws: { ["WebSocketServer"]: FakeWebSocketServer } } },
        {
          provide: AppProviderService,
          useValue: {
            workspaceService: { getWorkspace: () => workspace, persistWorkspace: (w: Workspace) => (workspace = w) },
            logService: { log: () => {} },
          },
        },
        { provide: MessageToasterService, useValue: { toast: (message: string, level: ToastLevel) => toasts.push({ message, level }) } },
        { provide: WindowService, useValue: { openExternalUrl: () => {} } },
      ],
    });
    service = TestBed.inject(ExtensionWebsocketService);
  });

  afterEach(() => {
    if (savedFlavor === undefined) {
      delete process.env.LEAPP_FLAVOR;
    } else {
      process.env.LEAPP_FLAVOR = savedFlavor;
    }
  });

  it("with the option off, no WebSocket server is created at startup", () => {
    workspace.extensionEnabled = false;
    service.bootstrap();
    expect(FakeWebSocketServer.created).toEqual([]);
  });

  it("with the option on, the servers listen on 127.0.0.1:8095 and ::1:8095 and nowhere else", () => {
    workspace.extensionEnabled = true;
    service.bootstrap();
    expect(listening()).toEqual([
      { host: "127.0.0.1", port: 8095 },
      { host: "::1", port: 8095 },
    ]);
  });

  it("the dev flavor listens on its own port 8096, still on loopback only", () => {
    process.env.LEAPP_FLAVOR = "dev";
    workspace.extensionEnabled = true;
    service.bootstrap();
    expect(listening()).toEqual([
      { host: "127.0.0.1", port: 8096 },
      { host: "::1", port: 8096 },
    ]);
  });

  it("turning the option on saves it and starts the loopback servers", () => {
    workspace.extensionEnabled = false;
    service.bootstrap();

    service.setEnabled(true);
    expect(workspace.extensionEnabled).toBe(true);
    expect(listening()).toEqual([
      { host: "127.0.0.1", port: 8095 },
      { host: "::1", port: 8095 },
    ]);
  });

  it("turning it on twice does not start a second pair of servers", () => {
    service.setEnabled(true);
    service.setEnabled(true);
    expect(FakeWebSocketServer.created.length).toBe(2);
  });

  it("turning the option off closes every client with 1001, stops listening and resets the fetching state", () => {
    service.setEnabled(true);
    const ipv4Client = FakeWebSocketServer.created[0].connect();
    const ipv6Client = FakeWebSocketServer.created[1].connect();
    service.fetching$.next(FetchingState.fetchingRequested);

    service.setEnabled(false);
    expect(workspace.extensionEnabled).toBe(false);
    expect(ipv4Client.closedWith).toBe(1001);
    expect(ipv6Client.closedWith).toBe(1001);
    expect(listening()).toEqual([]);
    expect(service.fetching$.value).toBe(FetchingState.notFetching);
  });

  it("messages go to the clients of both loopback servers", () => {
    service.setEnabled(true);
    const ipv4Client = FakeWebSocketServer.created[0].connect();
    const ipv6Client = FakeWebSocketServer.created[1].connect();

    service.sendMessage("payload");
    expect(ipv4Client.sent).toEqual(["payload"]);
    expect(ipv6Client.sent).toEqual(["payload"]);
  });

  it("port already in use on 127.0.0.1 shows the warning toast and the app keeps running", async () => {
    FakeWebSocketServer.failures.set("127.0.0.1", "EADDRINUSE");
    service.setEnabled(true);
    await settle();

    expect(toasts).toEqual([
      {
        message: "Multi-Console extension unavailable: port 8095 is already in use or blocked. Web Consoles open with the standard method.",
        level: ToastLevel.warn,
      },
    ]);
  });

  it("no IPv6 loopback (EADDRNOTAVAIL on ::1) shows no toast and 127.0.0.1 still serves", async () => {
    FakeWebSocketServer.failures.set("::1", "EADDRNOTAVAIL");
    service.setEnabled(true);
    await settle();

    expect(toasts).toEqual([]);
    const client = FakeWebSocketServer.created[0].connect();
    service.sendMessage("payload");
    expect(client.sent).toEqual(["payload"]);
  });
});
