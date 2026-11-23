import { constants } from "@noovolari/leapp-core/models/constants";
import { Injectable } from "@angular/core";
import { AppNativeService } from "./app-native.service";
import { AppProviderService } from "./app-provider.service";
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { BehaviorSubject } from "rxjs";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";
import { WindowService } from "./window.service";
import { OptionsService } from "./options.service";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";

export enum FetchingState {
  notFetching,
  fetchingRequested,
  fetching,
}

@Injectable({
  providedIn: "root",
})
export class ExtensionWebsocketService {
  // One server per loopback address (the extension connects to ws://localhost, IPv4 or IPv6)
  public wsServers: any[] = [];
  public fetching$: BehaviorSubject<FetchingState>;
  private fetchingTimeout: any;
  private consoleUrl: string;

  constructor(
    private appNativeService: AppNativeService,
    private appProviderService: AppProviderService,
    private toastService: MessageToasterService,
    private windowService: WindowService,
    private optionsService: OptionsService
  ) {
    this.fetching$ = new BehaviorSubject(FetchingState.notFetching);
    this.fetching$.subscribe(async (value) => {
      clearTimeout(this.fetchingTimeout);
      if (value === FetchingState.fetching) {
        await this.pause();
        this.sendMessage(JSON.stringify({ type: "get-fetching-state" }));
        this.fetchingTimeout = setTimeout(() => {
          this.fetching$.next(FetchingState.notFetching);
          try {
            this.windowService.openExternalUrl(this.consoleUrl);
            this.toastService.toast(
              "Communication Error. Be sure to have your browser open and the extension installed. Opening it with the standard method...",
              ToastLevel.warn
            );
          } catch (err) {
            this.toastService.toast("An error occured while opening the web console. Malformed session information", ToastLevel.error);
          } finally {
            this.consoleUrl = undefined;
          }
        }, 4000);
      }
    });
  }

  /** At startup: the server runs only while the Multi-Console option is on. */
  bootstrap(): void {
    if (this.optionsService.extensionEnabled) {
      this.start();
    }
  }

  /** The Multi-Console option of Options: saves it and starts or stops the server. */
  setEnabled(enabled: boolean): void {
    this.optionsService.extensionEnabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Listens on loopback only: 127.0.0.1 and ::1, never every interface, so other hosts on the network
   * Can't connect. The port is the flavor's (8095 prod, the published extension; 8096 dev; 8097 qa).
   */
  start(): void {
    if (this.wsServers.length > 0) {
      return;
    }
    const ws = this.appNativeService.ws;
    const port = constants.extensionWebSocketPort;
    for (const host of ["127.0.0.1", "::1"]) {
      const server = new ws.WebSocketServer({ host, port });
      server.on("error", (error: any) => this.onListenError(server, host, port, error));
      server.on("connection", (wsClient) => {
        wsClient.on("message", (data) => {
          const parsedData = JSON.parse(data.toString("utf8"));
          if (parsedData.type === "send-fetching-state") {
            this.fetching$.next(parsedData.fetching ? FetchingState.fetching : FetchingState.notFetching);
          }
        });
      });
      this.wsServers.push(server);
    }
  }

  /** Closes every client (1001, going away) and the servers; nothing listens afterwards. */
  stop(): void {
    for (const server of this.wsServers) {
      server.clients.forEach((client) => client.close(1001));
      server.close();
    }
    this.wsServers = [];
    this.fetching$.next(FetchingState.notFetching);
  }

  sendMessage(payload: any): void {
    for (const server of this.wsServers) {
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }

  async openWebConsoleWithExtension(session: Session): Promise<void> {
    this.fetching$.next(FetchingState.fetchingRequested);
    this.appProviderService.behaviouralSubjectService.unselectSessions();
    const sessionService = this.appProviderService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    let credentialsInfo;
    try {
      credentialsInfo = await sessionService.generateCredentials(session.sessionId);
    } catch (error) {
      this.fetching$.next(FetchingState.notFetching);
      throw error;
    }
    this.consoleUrl = await this.appProviderService.webConsoleService.getWebConsoleUrl(credentialsInfo, session.region);
    this.sendMessage(
      JSON.stringify({
        type: "create-new-session",
        sessionInfo: {
          url: this.consoleUrl,
          sessionName: session.sessionName,
          sessionRole: (session as any).roleArn.split("/")[1],
          sessionRegion: session.region,
          sessionType: session.type.toString().startsWith("aws") ? "aws" : session.type.toString(),
          createdAt: new Date().getTime(),
        },
        leappSessionId: session.sessionId,
      })
    );
    this.fetching$.next(FetchingState.fetching);
    this.toastService.toast("Opening Web Console with the Leapp Extension...", ToastLevel.info);
  }

  private onListenError(server: any, host: string, port: number, error: any): void {
    this.wsServers = this.wsServers.filter((running) => running !== server);
    const noIpv6Loopback = host === "::1" && ["EADDRNOTAVAIL", "EAFNOSUPPORT"].includes(error?.code);
    const message = noIpv6Loopback
      ? `Multi-Console: no IPv6 loopback, listening on 127.0.0.1:${port} only`
      : `Multi-Console extension unavailable: port ${port} is already in use or blocked. Web Consoles open with the standard method.`;
    this.appProviderService.logService.log(new LoggedEntry(`${message} (${host}: ${error?.code ?? error?.message})`, this, LogLevel.info));
    if (!noIpv6Loopback && host === "127.0.0.1") {
      this.toastService.toast(message, ToastLevel.warn);
    }
  }

  private pause(): Promise<void> {
    return new Promise((resolve, _) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 300);
    });
  }
}
