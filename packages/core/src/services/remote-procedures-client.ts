import { RegisterClientResponse, StartDeviceAuthorizationResponse, VerificationResponse } from "./session/aws/aws-sso-role-service";
import { constants } from "../models/constants";
import { INativeService } from "../interfaces/i-native-service";
import { RpcRequest, RpcResponse, arrayToUInt8Array, uInt8ArrayToArray } from "./remote-procedures-server";

const connectionError = "unable to connect with desktop app";

export class RemoteProceduresClient {
  constructor(private nativeService: INativeService, private serverId = constants.ipcServerId) {}

  async isDesktopAppRunning(): Promise<boolean> {
    return this.remoteProcedureCall(
      { method: "isDesktopAppRunning", params: {} },
      (data, resolve, _) => resolve(data.result),
      (resolve, _) => resolve(false)
    );
  }

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return this.remoteProcedureCall(
      { method: "needAuthentication", params: { idpUrl } },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async needMfa(sessionName: string): Promise<string> {
    return this.remoteProcedureCall(
      { method: "needMFA", params: { sessionName } },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<string> {
    return this.remoteProcedureCall(
      { method: "awsSignIn", params: { idpUrl, needToAuthenticate } },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    onWindowClose: () => void
  ): Promise<VerificationResponse> {
    return this.remoteProcedureCall(
      {
        method: "openVerificationWindow",
        params: { registerClientResponse, startDeviceAuthorizationResponse, windowModality },
      },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError),
      (data, _, __) => (data.callbackId === "onWindowClose" ? onWindowClose() : null)
    );
  }

  async refreshSessions(): Promise<void> {
    return this.remoteProcedureCall(
      { method: "refreshSessions", params: {} },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async refreshIntegrations(): Promise<void> {
    return this.remoteProcedureCall(
      { method: "refreshIntegrations", params: {} },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async msalProtectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array, scope: string): Promise<Uint8Array> {
    return this.remoteProcedureCall(
      {
        method: "msalProtectData",
        params: {
          dataToEncrypt: uInt8ArrayToArray(dataToEncrypt),
          optionalEntropy: uInt8ArrayToArray(optionalEntropy),
          scope,
        },
      },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(arrayToUInt8Array(data.result))),
      (_, reject) => reject(connectionError)
    );
  }

  async msalUnprotectData(encryptedData: Uint8Array, optionalEntropy: Uint8Array, scope: string): Promise<Uint8Array> {
    return this.remoteProcedureCall(
      {
        method: "msalUnprotectData",
        params: {
          encryptedData: uInt8ArrayToArray(encryptedData),
          optionalEntropy: uInt8ArrayToArray(optionalEntropy),
          scope,
        },
      },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(uInt8ArrayToArray(data.result))),
      (_, reject) => reject(connectionError)
    );
  }

  async keychainSaveSecret(service: string, account: string, password: string): Promise<void> {
    return this.remoteProcedureCall(
      {
        method: "keychainSaveSecret",
        params: { service, account, password },
      },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async keychainGetSecret(service: string, account: string): Promise<string | null> {
    return this.remoteProcedureCall(
      {
        method: "keychainGetSecret",
        params: { service, account },
      },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async keychainDeleteSecret(service: string, account: string): Promise<boolean> {
    return this.remoteProcedureCall(
      {
        method: "keychainDeleteSecret",
        params: { service, account },
      },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async refreshWorkspaceState(): Promise<void> {
    return this.remoteProcedureCall(
      { method: "refreshWorkspaceState", params: {} },
      (data, resolve, reject) => (data.error ? reject(data.error) : resolve(data.result)),
      (_, reject) => reject(connectionError)
    );
  }

  async remoteProcedureCall(
    rpcRequest: RpcRequest,
    onReturn: (data: RpcResponse, resolve: (value: unknown) => void, reject: (reason?: any) => void) => void,
    onDisconnect: (resolve: (value: unknown) => void, reject: (reason?: any) => void) => void,
    onCallback?: (data: RpcResponse, resolve: (value: unknown) => void, reject: (reason?: any) => void) => void
  ): Promise<any> {
    const ipc = this.nativeService.nodeIpc;
    ipc.config.id = "leapp_cli";
    ipc.config.maxRetries = 2;
    ipc.config.silent = true;
    ipc.config.encoding = "utf8";
    return new Promise((resolve, reject) => {
      ipc.connectTo(this.serverId, () => {
        const desktopAppServer = ipc.of[this.serverId];
        desktopAppServer.on("connect", () => {
          desktopAppServer.emit("message", rpcRequest);
        });
        desktopAppServer.on("disconnect", () => {
          onDisconnect(resolve, reject);
        });
        desktopAppServer.on("message", (data: RpcResponse) => {
          if (data.callbackId && onCallback) {
            onCallback(data, resolve, reject);
          } else {
            onReturn(data, resolve, reject);
            ipc.disconnect(this.serverId);
          }
        });
      });
    });
  }
}
