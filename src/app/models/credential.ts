export interface AwsCredentials {
  [key: string]: AwsCredential;
}

export interface AwsCredential {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  aws_access_key_id?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  aws_secret_access_key?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  aws_session_token?: string;
  expiration?: string;
  consoleUsername?: string;
  accountId?: string;
  consolePassword?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  role_arn?: string;
  region?: string;
}
