interface AssumeRoleResponse {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AssumedRoleUser: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AssumedRoleId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Arn: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Credentials: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SecretAccessKey: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SessionToken: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Expiration: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AccessKeyId: string;
  };
}
