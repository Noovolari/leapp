import { Socket } from "net";
import { constants } from "../models/constants";
import { INativeService } from "../interfaces/i-native-service";
import { IAwsSsoOidcVerificationWindowService } from "../interfaces/i-aws-sso-oidc-verification-window-service";
import { IAwsSamlAuthenticationService } from "../interfaces/i-aws-saml-authentication-service";
import { Repository } from "./repository";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { IMfaCodePrompter } from "../interfaces/i-mfa-code-prompter";

export interface RpcResponse {
  result?: any;
  error?: any;
  callbackId?: string;
}

export interface RpcRequest {
  method: string;
  params: any;
}

type EmitFunction = (socket: Socket, event: string, value?: RpcResponse) => void;
type RemoteProcedureFunctions = (emitFunction: EmitFunction, socket: Socket, data?: RpcRequest) => void;

export class RemoteProceduresServer {
  private rpcMethods: Map<string, RemoteProcedureFunctions>;

  constructor(
    private nativeService: INativeService,
    private verificationWindowService: IAwsSsoOidcVerificationWindowService,
    private awsAuthenticationService: IAwsSamlAuthenticationService,
    private mfaCodePrompter: IMfaCodePrompter,
    private repository: Repository,
    private behaviouralSubjectService: BehaviouralSubjectService,
    private uiSafeFn: (uiSafeBlock: () => void) => void,
    private serverId = constants.ipcServerId
  ) {
    this.rpcMethods = new Map([
      ["isDesktopAppRunning", this.isDesktopAppRunning],
      ["needAuthentication", this.needAuthentication],
      ["needMFA", this.needMfa],
      ["awsSignIn", this.awsSignIn],
      ["openVerificationWindow", this.openVerificationWindow],
      ["refreshIntegrations", this.refreshIntegrations],
      ["refreshSessions", this.refreshSessions],
    ]);
  }

  startServer(): void {
    const ipc = this.nativeService.nodeIpc;
    ipc.config.id = this.serverId;
    ipc.serve(() => {
      ipc.server.on("message", (data: RpcRequest, ipcSocket: Socket) => {
        const emitFunction = (socket: Socket, event: string, value?: any) => ipc.server.emit(socket, event, value);

        const rpcFunction = this.rpcMethods.get(data.method);
        if (rpcFunction) {
          rpcFunction.call(this, emitFunction, ipcSocket, data);
        } else {
          ipcSocket.destroy();
        }
      });
    });

    ipc.server.start();
  }

  stopServer(): void {
    this.nativeService.nodeIpc.server.stop();
  }

  private isDesktopAppRunning(emitFunction: EmitFunction, socket: Socket): void {
    emitFunction(socket, "message", { result: true });
  }

  private needMfa(emitFunction: EmitFunction, socket: Socket, data: RpcRequest): void {
    try {
      this.mfaCodePrompter.promptForMFACode(data.params.sessionName, (result) => {
        emitFunction(socket, "message", { result });
      });
    } catch (error) {
      emitFunction(socket, "message", { error: error.message });
    }
  }

  private needAuthentication(emitFunction: EmitFunction, socket: Socket, data: RpcRequest): void {
    this.awsAuthenticationService
      .needAuthentication(data.params.idpUrl)
      .then((result: boolean) => {
        emitFunction(socket, "message", { result });
      })
      .catch((error) => emitFunction(socket, "message", { error: error.message }));
  }

  private awsSignIn(emitFunction: EmitFunction, socket: Socket, data: RpcRequest): void {
    this.awsAuthenticationService
      .awsSignIn(data.params.idpUrl, data.params.needToAuthenticate)
      .then((result: any) => emitFunction(socket, "message", { result }))
      .catch((error) => emitFunction(socket, "message", { error: error.message }));
  }

  private openVerificationWindow(emitFunction: EmitFunction, socket: Socket, data: RpcRequest): void {
    this.verificationWindowService
      .openVerificationWindow(data.params.registerClientResponse, data.params.startDeviceAuthorizationResponse, data.params.windowModality, () =>
        emitFunction(socket, "message", { callbackId: "onWindowClose" })
      )
      .then((result: any) => emitFunction(socket, "message", { result }))
      .catch((error) => emitFunction(socket, "message", { error: error.message }));
  }

  private refreshIntegrations(emitFunction: EmitFunction, socket: Socket): void {
    try {
      this.repository.reloadWorkspace();
      this.uiSafeFn(() => {
        const workspace = this.repository.getWorkspace();
        workspace.awsSsoIntegrations = this.repository.listAwsSsoIntegrations();
        this.repository.persistWorkspace(workspace);
        this.behaviouralSubjectService.setIntegrations(this.repository.listAwsSsoIntegrations());
      });
      emitFunction(socket, "message", {});
    } catch (error) {
      emitFunction(socket, "message", { error: error.message });
    }
  }

  private refreshSessions(emitFunction: EmitFunction, socket: Socket) {
    try {
      this.repository.reloadWorkspace();
      this.uiSafeFn(() => {
        this.behaviouralSubjectService.setSessions(this.repository.getSessions());
      });
      emitFunction(socket, "message", {});
    } catch (error) {
      emitFunction(socket, "message", { error: error.message });
    }
  }
}
