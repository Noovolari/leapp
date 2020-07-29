import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class CommandErrorHandlerService {
  private onerror: EventEmitter<any> = new EventEmitter();

  emit(param: any) {
    this.onerror.emit(param);
  }

  subscribe(callback: any) {
    this.onerror.subscribe(callback);
  }
}
