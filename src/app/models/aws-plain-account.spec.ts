import {AwsPlainAccount} from './aws-plain-account';

describe('AwsPlainAccount', () => {
  it('should create an instance', () => {
    expect(new AwsPlainAccount()).toBeTruthy();
  });
});
