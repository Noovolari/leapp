import { Injectable } from "@angular/core";
import { AppNativeService } from "./app-native.service";

@Injectable({
  providedIn: "root",
})
export class ExtensionWebsocketService {
  public wsServer: any;
  public port: string;
  public wsClient: any;

  constructor(private appNativeService: AppNativeService) {}

  bootstrap(): void {
    const ws = this.appNativeService.ws;
    this.wsServer = new ws.WebSocketServer({
      //TODO add configurable port option
      port: 8095,
    });
    this.wsServer.on("connection", (wsClient) => {
      this.wsClient = wsClient;
      this.wsClient.on("message", (data) => {
        console.log("received: %s", data.toString("utf8"));
      });
      setInterval(() => this.sendMessage("ping"), 5000);
    });
  }

  sendMessage(payload: any): void {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}
