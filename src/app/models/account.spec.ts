import {Account} from './account';
import {AccountType} from './AccountType';

describe('Account', () => {
  it('should create an instance', () => {
    expect(new Account('ciao', AccountType.AWS, 'us')).toBeInstanceOf(Account);
  });
});
