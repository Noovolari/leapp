import {AwsPlainAccount} from './aws-plain-account';
import {AccountType} from './AccountType';

describe('AwsPlainAccount', () => {
  it('should create an instance', () => {
    expect(new AwsPlainAccount('', AccountType.AWS_PLAIN_USER, '')).toBeDefined();
  });
});
