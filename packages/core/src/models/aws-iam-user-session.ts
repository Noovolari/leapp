import { SessionType } from "./session-type";
import { Session } from "./session";

/**
 * Contains non-sensitive information of an AWS Iam User Session.
 * Sensitive information is saved in the local OS keychain.
 */
export class AwsIamUserSession extends Session {
  /** id of the session named profile */
  mfaDevice?: string;

  /** expiration time of the session token in ISO 8601 format */
  sessionTokenExpiration: string;

  /** id of the named profile associated with the session */
  profileId: string;

  /**
   * Create an AWS Iam User Session
   *
   * @param sessionName - name of the session
   * @param region - name of the session AWS region
   * @param profileId - id of the named profile associated with the session
   * @param [mfaDevice] - the serial number that uniquely identifies the MFA device. For virtual MFA devices, the serial number is the device ARN.
   */
  constructor(sessionName: string, region: string, profileId: string, mfaDevice?: string) {
    super(sessionName, region);

    this.mfaDevice = mfaDevice;
    this.type = SessionType.awsIamUser;
    this.profileId = profileId;
  }
}
