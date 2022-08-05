import { Flags } from "@oclif/core";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

export const force = Flags.boolean({
  description: "force a command without asking for confirmation (-f, --force)", // help description for flag
  hidden: false,
  default: false,
  char: "f",
});

// IDP URL
export const idpUrl = Flags.string({
  description: "the idp url address we want to create", // help description for flag
  hidden: false,
});

export const idpUrlId = Flags.string({
  description: "the idp url id that we want to pass to the function like the delete one", // help description for flag
  hidden: false,
});

// INTEGRATIONS
export const integrationId = Flags.string({
  description: "the Integration Id used to identify the integration inside Leapp",
  hidden: false,
});

export const integrationAlias = Flags.string({
  description: "alias that identifies an integration",
  hidden: false,
});

export const integrationPortalUrl = Flags.string({
  description: "url that identifies the integration portal where you authenticate",
  hidden: false,
});

export const integrationRegion = Flags.string({
  description: "an AWS valid region code for the integration",
  hidden: false,
});

export const integrationMethod = Flags.string({
  description: "value is either In-app or In-browser, identifies the preferred method to authenticate against portal URL",
  hidden: false,
});

// PROFILES
export const profileId = Flags.string({
  description: "an AWS named profile ID in Leapp",
  hidden: false,
});

export const profileName = Flags.string({
  description: "an AWS named profile Alias used to identify the profile in both config and credential file",
  hidden: false,
});

// SESSION
export const sessionId = Flags.string({
  description: "Session Id to identify the session in Leapp, recover it with $leapp session list -x",
  hidden: false,
});

export const sessionName = Flags.string({
  description: "Session Alias to identify the session in Leapp",
  hidden: false,
});

export const region = Flags.string({
  description: "Session Region for AWS sessions in Leapp",
  hidden: false,
});

export const providerType = Flags.string({
  description: "Identify the provider for your sessions. Valid types are [aws]",
  hidden: false,
  options: [SessionType.aws.toString() /*, SessionType.azure.toString()*/],
});

export const sessionType = Flags.string({
  description: "Identify the AWS session type. Valid types are [awsIamRoleFederated, awsIamUser, awsIamRoleChained]",
  hidden: false,
  options: [
    SessionType.awsIamRoleFederated.toString(),
    SessionType.awsIamUser.toString(),
    SessionType.awsIamRoleChained.toString(),
    /*SessionType.azure.toString(),*/
  ],
});

export const idpArn = Flags.string({
  description: "AWS IAM Federated Role IdP Arn value, obtain it from your AWS Account",
  hidden: false,
});
export const roleArn = Flags.string({
  description: "AWS IAM Federated Role Arn value, obtain it from your AWS Account",
  hidden: false,
});
export const mfaDevice = Flags.string({
  description: "MFA Device Arn retrieved from your AWS Account",
  hidden: false,
});
export const parentSessionId = Flags.string({
  description:
    "For AWS IAM Role Chained is the session Id of the session that will assume the chained role. Retrieve it using $leapp session list -x",
  hidden: false,
});
export const roleSessionName = Flags.string({
  description: "Optional Alias for the Assumed Role Session name",
  hidden: false,
});
/*export const tenantId = Flags.string({
  description: "The Azure session Tenant Id",
  hidden: false,
});
export const subscriptionId = Flags.string({
  description: "The Azure session Subscription Id",
  hidden: false,
});*/
export const accessKey = Flags.string({
  description: "AWS Access Key ID of the IAM User",
  hidden: false,
});
export const secretKey = Flags.string({
  description: "AWS Secret Access Key of the IAM User",
  hidden: false,
});
export const ssmInstanceId = Flags.string({
  description: "Instance ID for EC2 instance we want to access with SSM",
  hidden: false,
});
export const print = Flags.boolean({
  description: "Print an AWS Web Console login URL in the terminal instead of opening the web browser",
  hidden: false,
  default: false,
  char: "p",
});
