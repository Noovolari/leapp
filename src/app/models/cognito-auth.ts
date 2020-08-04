// TODO: Cognito token is needed?
export interface CognitoAuth {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  token_type: string;
}
