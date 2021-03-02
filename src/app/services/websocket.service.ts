import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  subject: WebSocketSubject<any>;

  constructor() {}

  create(url) {
    this.subject = webSocket(url);
  }

  connect(callbackReceived, callbackError, callbackClosed) {
    this.subject.subscribe(
      msg => callbackReceived(msg), // Called whenever there is a message from the server.
      err => callbackError(err), // Called if at any point WebSocket API signals some kind of error.
      () => callbackClosed // Called when connection is closed (for whatever reason).
    );
  }

  sendMessage(payload) {
    this.subject.next(payload);
  }

  close() {
    this.subject.next({ code: 1000, reason: 'Closed app' });
    this.subject.complete();
  }
}
