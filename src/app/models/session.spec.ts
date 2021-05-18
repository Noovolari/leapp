import {Session} from './session';
import {Account} from './account';
import {environment} from '../../environments/environment';

describe('expire()', () => {
  it('should return TRUE if the expiration time is over', () => {
    const sessionDuration = environment.sessionDuration;

    const session = new Session(new Account('account', 'eu-west-1'), 'fakeid');
    session.startDateTime = new Date(Date.now() - sessionDuration * 1000 - 1).toISOString();

    expect(session.expired()).toBeTruthy();
  });

  it('should return FALSE if the expiration time is not over yet', () => {
    const session = new Session(new Account('account', 'eu-west-1'), 'fakeid');
    session.startDateTime = new Date().toISOString();
    expect(session.expired()).not.toBeTruthy();
  });
});
