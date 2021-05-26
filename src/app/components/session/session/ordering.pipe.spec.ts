import { OrderingPipe } from './ordering.pipe';
import {Session} from '../../../models/session';
import * as uuid from 'uuid';
import {AwsPlainSession} from '../../../models/aws-plain-session';

let sessions: Session[] = [];

describe('OrderingPipe', () => {
  beforeEach(() => {
    sessions = [];
    sessions.push(new AwsPlainSession('account1', 'eu-west-1', ''));
    sessions.push(new AwsPlainSession('account2', 'eu-west-1', ''));
    sessions.push(new AwsPlainSession('account3', 'eu-west-1', ''));
    sessions.push(new AwsPlainSession('account4', 'eu-west-1', ''));
    sessions.push(new AwsPlainSession('account5', 'eu-west-1', ''));
  });

  it('create an instance', () => {
    const pipe = new OrderingPipe();
    expect(pipe).toBeTruthy();
  });

  it('should order sessions based on their lastStopDateTime property', () => {
    const pipe = new OrderingPipe();

    // YYYY - DD - MM
    sessions[0].lastStopDateTime = new Date('2021-04-03').toISOString();
    sessions[1].lastStopDateTime = new Date('2021-02-03').toISOString();
    sessions[2].lastStopDateTime = new Date('2021-05-03').toISOString();
    sessions[3].lastStopDateTime = new Date('2021-01-03').toISOString();
    sessions[4].lastStopDateTime = new Date('2021-08-03').toISOString();

    expect(sessions[0].sessionName).toBe('account1');
    expect(sessions[1].sessionName).toBe('account2');
    expect(sessions[2].sessionName).toBe('account3');
    expect(sessions[3].sessionName).toBe('account4');
    expect(sessions[4].sessionName).toBe('account5');

    sessions = pipe.transform(sessions);

    expect(sessions[0].sessionName).toBe('account5');
    expect(sessions[1].sessionName).toBe('account3');
    expect(sessions[2].sessionName).toBe('account1');
    expect(sessions[3].sessionName).toBe('account2');
    expect(sessions[4].sessionName).toBe('account4');
  });

  it('should order even when lastStopDateTime is not managed directly', () => {
    const pipe = new OrderingPipe();

    sessions[0].lastStopDateTime = new Date('2000-02-03').toISOString();
    sessions[4].lastStopDateTime = new Date('2000-03-03').toISOString();

    sessions = pipe.transform(sessions);
    // Because [1], [2], [3] are set automatically their value is today which is always
    // greater than 2000 so we check the order of the last 2 elements
    expect(sessions[3].sessionName).toBe('account5');
    expect(sessions[4].sessionName).toBe('account1');
  });

  it('should invert the order when asc option is used', () => {
    const pipe = new OrderingPipe();

    sessions[0].lastStopDateTime = new Date('2021-04-03').toISOString();
    sessions[1].lastStopDateTime = new Date('2021-02-03').toISOString();
    sessions[2].lastStopDateTime = new Date('2021-05-03').toISOString();
    sessions[3].lastStopDateTime = new Date('2021-01-03').toISOString();
    sessions[4].lastStopDateTime = new Date('2021-08-03').toISOString();

    expect(sessions[0].sessionName).toBe('account1');
    expect(sessions[1].sessionName).toBe('account2');
    expect(sessions[2].sessionName).toBe('account3');
    expect(sessions[3].sessionName).toBe('account4');
    expect(sessions[4].sessionName).toBe('account5');

    sessions = pipe.transform(sessions, true);

    expect(sessions[0].sessionName).toBe('account4');
    expect(sessions[1].sessionName).toBe('account2');
    expect(sessions[2].sessionName).toBe('account1');
    expect(sessions[3].sessionName).toBe('account3');
    expect(sessions[4].sessionName).toBe('account5');
  });
});
