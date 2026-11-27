import { RegisterClientResponse, StartDeviceAuthorizationResponse, VerificationResponse } from "../services/session/aws/aws-sso-role-service";

export interface IAwsSsoOidcVerificationWindowService {
  openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    /** The user closed the window, or it failed to load the page (`error` is the error text). */
    onWindowClose: (error?: string) => void
  ): Promise<VerificationResponse>;

  /**
   * Closes the verification window this service opened, because the login is over (token received, timeout or
   * error). A close made here must not call `onWindowClose`, which is only for a close by the user or a load error. Optional:
   * a client that cannot close the page (the user's browser) does not implement it.
   */
  closeVerificationWindow?(): void;
}
