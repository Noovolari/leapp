/* eslint-disable @typescript-eslint/naming-convention */

export class AwsProcessCredentials {
  constructor(
    private Version: number,
    private AccessKeyId: string,
    private SecretAccessKey: string,
    private SessionToken: string,
    private Expiration: string
  ) {}
}
