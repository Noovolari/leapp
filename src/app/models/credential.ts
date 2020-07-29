export interface AwsCredentials {
  [key: string]: AwsCredential;
}

export interface AwsCredential {
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  aws_session_token?: string;
  consoleUsername?: string;
  accountId?: string;
  consolePassword?: string;
  role_arn?: string;
  region?: string;
}
