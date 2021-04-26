import {AwsPlainStrategy} from './aws-plain-strategy';

describe('AwsPlainStrategy', () => {
  it('should create an instance', () => {
    expect(new AwsPlainStrategy()).toBeTruthy();
  });
});
