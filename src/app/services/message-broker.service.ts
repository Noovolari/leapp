import { Injectable } from '@angular/core';
import {WebsocketService} from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class MessageBrokerService {

  constructor(private websocketService: WebsocketService) {}

  initialize() {
    this.websocketService.create('ws://localhost:8080/api/v1/ws/1');
    this.websocketService.connect(
      (msg) => { this.route(msg); },
      (err) => { this.handleRouteError(err); },
      () => { console.log('connection closed!!!!'); }
    );
  }

  route(payload) {
    switch (payload.code) {
      case 'SESSION': console.log(payload.body.message); break;
      default: console.log(payload.message); break;
    }
  }

  handleRouteError(error) {
    console.log(`error WS: ${error.toString()}`);
  }

  sendWebSocketMessage(payload) {
    this.websocketService.sendMessage(payload);
  }

  stop() {
    // Close WS
    this.websocketService.close();
  }
}
