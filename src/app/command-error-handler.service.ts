import { Injectable, EventEmitter } from '@angular/core';
import {Subscription} from 'rxjs';

@Injectable()
export class CommandErrorHandlerService {
  private onerror: EventEmitter<any> = new EventEmitter();
  private errorSubscription: Subscription;

  emit(param: any) {
    this.onerror.emit(param);
  }

  subscribe(callback: any) {
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
    }
    this.errorSubscription = this.onerror.subscribe(callback);
  }
}
