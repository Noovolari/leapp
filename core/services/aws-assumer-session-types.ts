import { SessionType } from "../models/session-type";

export const AWS_ASSUMER_SESSION_TYPES = [SessionType.awsIamUser, SessionType.awsIamRoleFederated, SessionType.awsSsoRole];
