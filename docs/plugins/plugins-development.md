This document is a Plugin SDK reference.
The Plugin SDK is part of Leapp Core and contains Base Classes that describe different types of plugins.

##PluginEnvironment

A [wrapper class](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/plugin-environment.ts) used to expose a minumum set of methods from Leapp Core.

Currently available methods:

###log
- **`log`**`(message: string, level: PluginLogLevel, display: boolean): void`

  Log a custom message in Leapp or in the log file

  | argument          | type |  description |
  | -------------------------- | --------- | --------|
  | message   | string     | the message to show  |
  | level    | [LogLevel](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/plugin-log-level.ts)   | severity of the message   |
  | display    | boolean     | shows the message in a toast in the desktop app when true. Otherwise, log it in the log files   |

###fetch
- **`fetch`**`(url: string): any`

  Retrieve the content of a URL. Returns a promise for the URL

  | argument          | type |  description |
  | -------------------------- | --------- | --------|
  | url   | string     | a valid HTTP URL to fetch from |

###openExternalUrl
- **`openExternalUrl`**`(url: string): void`

  Open an external URL in the default browser

  | argument          | type |  description |
  | -------------------------- | --------- | --------|
  | url   | string     | a valid HTTP URL to open in the default browser |

###createSession
- **`createSession`**`(createSessionData: SessionData): Promise<string>`

  Creates a new Leapp Session based on given SessionData

  | argument | type | description |
  | --- | --- | --- |
  | createSessionData | [SessionData](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/interfaces/session-data.ts) | the metadata used to create the Leapp Session

###cloneSession
- **`cloneSession`**`(session: Session): Promise<string>`

  This method allows you to clone the given Leapp Session. This operation is allowed for the following Leapp Session types:

  - AwsIamUserSession
  - AwsIamRoleFederatedSession
  - AwsIamRoleChainedSession

  | argument | type | description |
  | --- | --- | --- |
  | session | [Session](https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts) | the Leapp Session that I want to clone

###updateSession
- **`updateSession`**`(updateSessionData: SessionData, session: Session): Promise<void>`

  This method allows you to update the given session with the given updateSessionData. This operation is allowed for the following Leapp Session types:

  - AwsIamUserSession
  - AwsIamRoleFederatedSession
  - AwsIamRoleChainedSession

  | argument | type | description |
  | --- | --- | --- |
  | updateSessionData | [SessionData](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/interfaces/session-data.ts) | the metadata used to update the given Leapp Session
  | session | [Session](https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts) | the Leapp Session that I want to update

###openTerminal
- **`openTerminal`**`(command: string, env?: any): Promise<void>`

  Execute the given command in the platform-specific terminal; optionally, it is possible to set an env key/value object containing the env variables to export in the terminal, before the command execution.

  The terminal window base path is set to the home directory.

  | argument | type | description |
  | --- | --- | --- |
  | command | string | the command that I want to execute in the platform-specific terminal
  | env | any | optional key/value env variables object

###getProfileIdByName
- **`getProfileIdByName`**`(profileName: string): string`

  Returns the id of a named profile from its name if it exists, otherwise creates a new profile and returns its id. 
  
  Can be used when creating/editing a session since SessionData requires the id of a named profile

  | argument | type | description |
  | --- | --- | --- |
  | profileName | string | a valid named profile

###getIdpUrlIdByUrl
- **`getIdpUrlIdByUrl`**`(url: string): string`

  Return the ID of the IdpUrl object from the given URL if it exists, otherwise creates a new IdP URL and returns its ID.

  Can be used when creating/editing Federated Sessions since SessionData requires the ID of an IdP URL.

  | argument | type | description |
  | --- | --- | --- |
  | url | string | the URL associated with the IdpUrl I want to retrieve

---

###Example: display a toast message in Leapp

```typescript
this.pluginEnvironment.log("Hello World", LogLevel.info, true);
```

###Example: fetch basic usage

```typescript
const res = await this.pluginEnvironment.fetch(""); //Insert a custom URL
const response = await res.json();
```

###Example: open a URL in the browser

```typescript
this.pluginEnvironment.openExternalUrl("https://leapp.cloud");
```

###Example: create a session
```typescript
async applySessionAction(session: Session, credentials: any): Promise<void> {
    const profileId = this.pluginEnvironment.getProfileIdByName("default");
    const idpUrlId = this.pluginEnvironment.getIdpUrlIdByUrl("put a valid url for an IdP here");
  
    this.pluginEnvironment.createSession(new AwsIamRoleFederatedSessionData(
      "arn:aws:iam::000000000000:saml-provider/test",
      idpUrlId,
      profileId,
      "us-east-1",
      "arn:aws:iam::000000000000:role/test",
      "New Name Session"
    ));
}
```

###Example: edit the selected session

```typescript
async applySessionAction(session: Session, credentials: any): Promise<void> {
    const profileId = this.pluginEnvironment.getProfileIdByName("default");
    const idpUrlId = this.pluginEnvironment.getIdpUrlIdByUrl("put a valid url for an IdP here");
    this
    .pluginEnvironment.updateSession(new AwsIamRoleFederatedSessionData(
        "arn:aws:iam::000000000000:saml-provider/test", 
        idpUrlId, 
        profileId, 
        "us-east-1", 
        "arn:aws:iam::000000000000:role/test", 
        "New Name Session"
    ), session);
}
```

###Example: clone the selected session
```typescript
async applySessionAction(session: Session, credentials: any): Promise<void> {
    await this.pluginEnvironment.cloneSession(session);
}
```

---

##AwsCredentialsPlugin

A [base class](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/aws-credentials-plugin.ts) that needs to be extended by a plugin and serves as the action class.

After extending this class, you need to implement these methods:

###applySessionAction
- **`applySessionAction`**`(session: Session, credentials: any): Promise<void>`

  Run your custom action

  | argument          | type |  description |
    | -------------------------- | --------- | --------|
  | session   | [Session](https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts)     | the Leapp session you run the action from |
  | credentials    | any | Leapp temporary-generated credentials  |

  The `credentials` object has the following structure:

```typescript
export interface CredentialsInfo {
  sessionToken: {
    aws_access_key_id: string;
    aws_secret_access_key: string;
    aws_session_token: string;
    region: string;
  }
}
```

###get actioName
- **`get actionName`**`(): string>`

  Return a name for the action that will be display in Leapp (e.g. "My Awesome Plugin")

###get actionIcon
- **`get actionIcon`**`(): string`

  Return a valid FontAwesome 5 code. Override default value in `package.json`

###Example: display a session-based message in Leapp

```typescript
async applySessionAction(session: Session, credentials: any): Promise<void> {
    if(session.type === Session.awsIamUser) {
        this.pluginEnvironment.log(`This is an IAM User session: ${session.sessionName}`, LogLevel.info, true); 
    }
    else {
        this.pluginEnvironment.log(`This is NOT an IAM User session: ${session.sessionName}`, LogLevel.info, true);
    }
}
```

---

##package.json metadata

| property          | values |  description | constraints |
| -------------------------- | --------- | --------| ----- |
| name   | a custom string     | the name of the plugin | the same used in the plugin folder |
| author   | a custom string     | the name of the author | none |
| version   | a custom string     | the version of the plugin | must be a semver string |
| description   | a custom string     | the description of the plugin | none |
| keywords   | a string array     | the name of the plugin | must contain at least "leapp-plugin" |
| leappPlugin   | an object     | the plugin custom configuration | must contain at least "supportedOS" and "supportedSessions" |
| leappPlugin.supportedOS   | a string array     | ["mac", "windows", "linux"] | if not specified, all OSs will be considered compatible |
| leappPlugin.supportedSessions   | a string array         | ["anyType, "aws", "azure", "awsIamRoleFederated", "awsIamRoleChained", "awsSsoRole", "awsIamUser"] | at least one of these values must be specified |
| leappPlugin.icon | a custom string | fontAwesome code for an icon (e.g. "fa fa-globe") | must be a valid [FontAwesome 5 code](https://fontawesome.com/v5/search)

##Plugin Examples

###Open Web Console
```typescript
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { PluginLogLevel } from "@noovolari/leapp-core/plugin-sdk/plugin-log-level";

export class WebConsolePlugin extends AwsCredentialsPlugin {
  get actionName(): string {
    return "Open web console";
  }

  get actionIcon(): string {
    return "fa fa-globe";
  }

  async applySessionAction(session: Session, credentials: any): Promise<void> {
    this.pluginEnvironment.log("Opening web console for session: " + session.sessionName, PluginLogLevel.info, true);

    const sessionRegion = session.region;
    const sessionDuration = 3200;
    const isUSGovCloud = sessionRegion.startsWith("us-gov-");
    let federationUrl;
    let consoleHomeURL;

    if (!isUSGovCloud) {
      federationUrl = "https://signin.aws.amazon.com/federation";
      consoleHomeURL = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;
    } else {
      federationUrl = "https://signin.amazonaws-us-gov.com/federation";
      consoleHomeURL = `https://console.amazonaws-us-gov.com/console/home?region=${sessionRegion}`;
    }

    if (sessionRegion.startsWith("cn-")) {
      throw new Error("Unsupported Region");
    }

    this.pluginEnvironment.log("Starting opening Web Console", PluginLogLevel.info, true);

    const sessionStringJSON = {
      sessionId: credentials.sessionToken.aws_access_key_id,
      sessionKey: credentials.sessionToken.aws_secret_access_key,
      sessionToken: credentials.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await this.pluginEnvironment.fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${(response as any).SigninToken}`;
    this.pluginEnvironment.openExternalUrl(loginURL);
  }
}
```
