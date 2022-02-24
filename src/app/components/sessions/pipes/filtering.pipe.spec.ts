import {FilteringPipe} from './filtering.pipe';
import {Session} from '../../../models/session';
import {SessionStatus} from '../../../models/session-status';

let sessions: Session[] = [];

describe('FilteringPipe', () => {
  beforeEach(() => {
    sessions = [];
    sessions.push(new Session('account1', 'eu-west-1'));
    sessions.push(new Session('account2', 'eu-west-1'));
    sessions.push(new Session('account3', 'eu-west-1'));
    sessions.push(new Session('account4', 'eu-west-1'));
    sessions.push(new Session('account5', 'eu-west-1'));

    sessions[1].status = SessionStatus.active;
    sessions[2].status = SessionStatus.active;
    sessions[4].status = SessionStatus.active;
  });

  it('create an instance', () => {
    const pipe = new FilteringPipe();
    expect(pipe).toBeTruthy();
  });

  it('should filter active sessions when asked for true', () => {
    const pipe = new FilteringPipe();
    expect(sessions.length).toBe(5);
    sessions = pipe.transform(sessions, true);
    expect(sessions.length).toBe(3);
  });

  it('should filter not active sessions when asked for false', () => {
    const pipe = new FilteringPipe();
    expect(sessions.length).toBe(5);
    sessions = pipe.transform(sessions, false);
    expect(sessions.length).toBe(2);
  });
});
