import {Subscription} from 'rxjs';
import {OnDestroy} from '@angular/core';

export class AntiMemLeak implements OnDestroy {
  subs: Subscription = new Subscription();

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
