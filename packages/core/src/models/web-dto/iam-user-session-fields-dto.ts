export class IamUserSessionFieldsDto {
  sessionId: string;
  sessionName: string;
  accessKey: string;
  secretKey: string;
  region: string;
  mfaDevice?: string;
  profileName?: string;
}
