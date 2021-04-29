import {Account} from './account';

describe('Account', () => {
  it('should create an instance', () => {
    expect(new Account('ciao', 'eu-west-1')).toBeInstanceOf(Account);
  });
});
