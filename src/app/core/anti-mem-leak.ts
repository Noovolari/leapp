import {Subscription} from 'rxjs';
import {OnDestroy} from '@angular/core';

/**
 * This class is used to collect subscription in every other file that implements it:
 * so when it is destroyed it unsubscribe all the subscriptions by itself.
 */
export class AntiMemLeak implements OnDestroy {
  // this can be seen by any class implementing AntiMemLeak
  subs: Subscription = new Subscription();

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
