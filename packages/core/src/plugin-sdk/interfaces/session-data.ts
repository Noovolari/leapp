import { SessionType } from "../../models/session-type";
import { CreateSessionRequest } from "../../services/session/create-session-request";

/**
 * This abstract class contains Leapp Session metadata required to generate a create/update request
 * A concrete implementation can be found in these files:
 * - aws-iam-role-chained-session-data.ts
 * - aws-iam-role-federated-session-data.ts
 * - aws-iam-user-session-data.ts
 *
 * AzureSession and AwsSsoRoleSession are Leapp Sessions automatically provisioned by Integrations;
 * it's not possible to create/update them outside the scope of an Integration.
 *
 * For the concrete implementations, the profileId and idpUrl fields refer to an internal ID
 * rather than the name assigned by the user.
 *
 * For this reason, the PluginEnvironment offers the methods getProfileIdByName() and getIdpUrlIdByUrl().
 * See the docs to find out more.
 */
export abstract class SessionData {
  /**
   * @param sessionType - the type of the Session the SessionData object refers to
   * @protected
   */
  protected constructor(public sessionType: SessionType) {}

  /**
   * Returns the specific Leapp Session creation request.
   */
  abstract getCreationRequest(): CreateSessionRequest;
}
