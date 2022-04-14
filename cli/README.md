Leapp CLI
=================

Leapp's Command Line Interface.

It relies on Leapp Core, which encapsulates the domain logic.

For more information about the project visit the [site](www.leapp.cloud).

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@noovolari/leapp-core.svg)](https://npmjs.org/package/@noovolari/leapp-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@noovolari/leapp-core.svg)](https://npmjs.org/package/@noovolari/leapp-cli)
[![License](https://img.shields.io/npm/l/@noovolari/leapp-core.svg)](https://github.com/Noovolari/leapp/package.json)
<!--[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)-->

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @noovolari/leapp-cli
$ leapp COMMAND
running command...
$ leapp (--version)
@noovolari/leapp-cli/0.1.8 darwin-x64 node-v16.14.0
$ leapp --help [COMMAND]
USAGE
  $ leapp COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`leapp help [COMMAND]`](#leapp-help-command)
* [`leapp idp-url create`](#leapp-idp-url-create)
* [`leapp idp-url delete`](#leapp-idp-url-delete)
* [`leapp idp-url edit`](#leapp-idp-url-edit)
* [`leapp idp-url list`](#leapp-idp-url-list)
* [`leapp integration create`](#leapp-integration-create)
* [`leapp integration delete`](#leapp-integration-delete)
* [`leapp integration list`](#leapp-integration-list)
* [`leapp integration login`](#leapp-integration-login)
* [`leapp integration logout`](#leapp-integration-logout)
* [`leapp integration sync`](#leapp-integration-sync)
* [`leapp profile create`](#leapp-profile-create)
* [`leapp profile delete`](#leapp-profile-delete)
* [`leapp profile edit`](#leapp-profile-edit)
* [`leapp profile list`](#leapp-profile-list)
* [`leapp region get-default`](#leapp-region-get-default)
* [`leapp region set-default`](#leapp-region-set-default)
* [`leapp session add`](#leapp-session-add)
* [`leapp session change-profile`](#leapp-session-change-profile)
* [`leapp session change-region`](#leapp-session-change-region)
* [`leapp session current`](#leapp-session-current)
* [`leapp session delete`](#leapp-session-delete)
* [`leapp session generate SESSIONID`](#leapp-session-generate-sessionid)
* [`leapp session get-id`](#leapp-session-get-id)
* [`leapp session list`](#leapp-session-list)
* [`leapp session open-web-console`](#leapp-session-open-web-console)
* [`leapp session start`](#leapp-session-start)
* [`leapp session start-ssm-session`](#leapp-session-start-ssm-session)
* [`leapp session stop`](#leapp-session-stop)

## `leapp help [COMMAND]`

Display help for leapp.

```
USAGE
  $ leapp help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for leapp.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `leapp idp-url create`

Create a new identity provider URL

```
USAGE
  $ leapp idp-url create [--idpUrl <value>]

FLAGS
  --idpUrl=<value>  the idp url address we want to create

DESCRIPTION
  Create a new identity provider URL

EXAMPLES
  $leapp idp-url create

  $leapp idp-url create --idpUrl ADDRESS
```

## `leapp idp-url delete`

Delete an identity provider URL

```
USAGE
  $ leapp idp-url delete [--idpUrlId <value>] [-f]

FLAGS
  -f, --force         force a command without asking for confirmation (-f, --force)
  --idpUrlId=<value>  the idp url id that we want to pass to the function like the delete one

DESCRIPTION
  Delete an identity provider URL

EXAMPLES
  $leapp idp-url delete

  $leapp idp-url delete --idpUrl ADDRESS

  $leapp idp-url delete --idpUrl ADDRESS [--force, -f]
```

## `leapp idp-url edit`

Edit an identity provider URL

```
USAGE
  $ leapp idp-url edit [--idpUrlId <value>] [--idpUrl <value>]

FLAGS
  --idpUrl=<value>    the idp url address we want to create
  --idpUrlId=<value>  the idp url id that we want to pass to the function like the delete one

DESCRIPTION
  Edit an identity provider URL

EXAMPLES
  $leapp idp-url edit

  $leapp idp-url edit --idpUrlId ID --idpUrl ADDRESS
```

## `leapp idp-url list`

Show identity providers list

```
USAGE
  $ leapp idp-url list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --csv              output is csv format [alias: --output=csv]
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --output=<option>  output in a more machine friendly format
                     <options: csv|json|yaml>
  --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show identity providers list

EXAMPLES
  $leapp idp-url list
```

## `leapp integration create`

Create a new AWS SSO integration

```
USAGE
  $ leapp integration create [--integrationAlias <value>] [--integrationPortalUrl <value>] [--integrationRegion <value>]
    [--integrationMethod <value>]

FLAGS
  --integrationAlias=<value>      alias that identifies an integration
  --integrationMethod=<value>     either in-app or in-browser, identifies the preferred method to authenticate against
                                  portal URL
  --integrationPortalUrl=<value>  url that identifies the integration portal where you authenticate
  --integrationRegion=<value>     an AWS valid region code for the integration

DESCRIPTION
  Create a new AWS SSO integration

EXAMPLES
  $leapp integration create

  $leapp integration create --integrationAlias ALIAS --integrationPortalUrl URL --integrationRegion REGION --integrationMethod [In-app, In-browser]
```

## `leapp integration delete`

Delete an integration

```
USAGE
  $ leapp integration delete [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Leapp

DESCRIPTION
  Delete an integration

EXAMPLES
  $leapp integration delete

  $leapp integration delete --integrationId ID
```

## `leapp integration list`

Show integrations list

```
USAGE
  $ leapp integration list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --csv              output is csv format [alias: --output=csv]
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --output=<option>  output in a more machine friendly format
                     <options: csv|json|yaml>
  --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show integrations list

EXAMPLES
  $leapp integration list
```

## `leapp integration login`

Login to synchronize integration sessions

```
USAGE
  $ leapp integration login [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Leapp

DESCRIPTION
  Login to synchronize integration sessions

EXAMPLES
  $leapp integration login

  $leapp integration login --integrationId ID
```

## `leapp integration logout`

Logout from integration

```
USAGE
  $ leapp integration logout [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Leapp

DESCRIPTION
  Logout from integration

EXAMPLES
  $leapp integration logout

  $leapp integration logout --integrationId ID
```

## `leapp integration sync`

Synchronize integration sessions

```
USAGE
  $ leapp integration sync [--integrationId <value>]

FLAGS
  --integrationId=<value>  the Integration Id used to identify the integration inside Leapp

DESCRIPTION
  Synchronize integration sessions

EXAMPLES
  $leapp integration sync

  $leapp integration sync --integrationId ID
```

## `leapp profile create`

Create a new AWS named profile

```
USAGE
  $ leapp profile create [--profileName <value>]

FLAGS
  --profileName=<value>  an AWS named profile Alias used to identify the profile in both config and credential file

DESCRIPTION
  Create a new AWS named profile

EXAMPLES
  $leapp profile create

  $leapp profile create --profileName PROFILENAME
```

## `leapp profile delete`

Delete an AWS named profile

```
USAGE
  $ leapp profile delete [--profileId <value>] [-f]

FLAGS
  -f, --force          force a command without asking for confirmation (-f, --force)
  --profileId=<value>  an AWS named profile ID in Leapp

DESCRIPTION
  Delete an AWS named profile

EXAMPLES
  $leapp profile delete

  $leapp profile delete --profileId PROFILEID

  $leapp profile delete --profileId PROFILEID [--force, -f]
```

## `leapp profile edit`

Rename an AWS named profile

```
USAGE
  $ leapp profile edit [--profileId <value>] [--profileName <value>]

FLAGS
  --profileId=<value>    an AWS named profile ID in Leapp
  --profileName=<value>  an AWS named profile Alias used to identify the profile in both config and credential file

DESCRIPTION
  Rename an AWS named profile

EXAMPLES
  $leapp profile edit

  $leapp profile edit --profileId ID --profileName PROFILENAME
```

## `leapp profile list`

Show profile list

```
USAGE
  $ leapp profile list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --csv              output is csv format [alias: --output=csv]
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --output=<option>  output in a more machine friendly format
                     <options: csv|json|yaml>
  --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show profile list

EXAMPLES
  $leapp profile list
```

## `leapp region get-default`

Displays the default region

```
USAGE
  $ leapp region get-default

DESCRIPTION
  Displays the default region

EXAMPLES
  $leapp region get-default
```

## `leapp region set-default`

Change the default region

```
USAGE
  $ leapp region set-default [--region <value>]

FLAGS
  --region=<value>  Session Region for session in Leapp, use it for both AWS Region and Azure Location

DESCRIPTION
  Change the default region

EXAMPLES
  $leapp region set-default

  $leapp region set-default --region AWSREGION
```

## `leapp session add`

Add a new session

```
USAGE
  $ leapp session add [--providerType aws|azure] [--accessKey <value>] [--idpArn <value>] [--idpUrl <value>]
    [--mfaDevice <value>] [--sessionName <value>] [--parentSessionId <value>] [--profileId <value>] [--region <value>]
    [--roleArn <value>] [--roleSessionName <value>] [--secretKey <value>] [--subscriptionId <value>] [--tenantId
    <value>] [--sessionType awsIamRoleFederated|awsIamUser|awsIamRoleChained|azure]

FLAGS
  --accessKey=<value>        AWS Access Key ID of the IAM User
  --idpArn=<value>           AWS IAM Federated Role IdP Arn value, obtain it from your AWS Account
  --idpUrl=<value>           the idp url address we want to create
  --mfaDevice=<value>        MFA Device Arn retrieved from your AWS Account
  --parentSessionId=<value>  For AWS IAM Role Chained is the session Id of the session that will assume the chained
                             role. Retrieve it using $leapp session list -x
  --profileId=<value>        an AWS named profile ID in Leapp
  --providerType=<option>    Identify the provider for your sessions. Valid types are [aws, azure]
                             <options: aws|azure>
  --region=<value>           Session Region for session in Leapp, use it for both AWS Region and Azure Location
  --roleArn=<value>          AWS IAM Federated Role Arn value, obtain it from your AWS Account
  --roleSessionName=<value>  Optional Alias for the Assumed Role Session name
  --secretKey=<value>        AWS Secret Access Key of the IAM User
  --sessionName=<value>      Session Alias to identify the session in Leapp
  --sessionType=<option>     Identify the session type for both AWS and Azure. Valid types are [awsIamRoleFederated,
                             awsIamUser, awsIamRoleChained, azure]
                             <options: awsIamRoleFederated|awsIamUser|awsIamRoleChained|azure>
  --subscriptionId=<value>   The Azure session Subscriptin Id
  --tenantId=<value>         The Azure session Tenant Id

DESCRIPTION
  Add a new session

EXAMPLES
  $leapp session add

  $leapp session add --providerType [aws, azure] --sessionType [awsIamRoleFederated, awsIamRoleChained, awsIamUser, azure] --region [AWSREGION, AZURELOCATION] --sessionName NAME ...[combination of flags relative to the session]

  $leapp session add --providerType azure --sessionType azure --sessionName NAME --region AZURELOCATION --tenantID TENANTID --subscriptionId SUBSCRIPTIONID

  $leapp session add --providerType aws --sessionType awsIamRoleFederated --sessionName NAME --region AWSREGION --idpArn IDPARN --idpUrl IDPURL --profileId PROFILEID --roleArn ROLEARN

  $leapp session add --providerType aws --sessionType awsIamRoleChained --sessionName NAME --region AWSREGION --profileId PROFILEID --roleArn ROLEARN --parentSessionUId ID (--roleSessionName ROLESESSIONNAME)

  $leapp session add --providerType aws --sessionType awsIamUser --sessionName NAME --region AWSREGION --profileId PROFILEID --accessKey ACCESSKEY --secretKey SECRETKEY (--mfaDevice MFADEVICEARN)
```

## `leapp session change-profile`

Change a session named-profile

```
USAGE
  $ leapp session change-profile [--sessionId <value>] [--profileId <value>]

FLAGS
  --profileId=<value>  an AWS named profile ID in Leapp
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Change a session named-profile

EXAMPLES
  $leapp session change-profile

  $leapp session change-profile --profileId PROFILEID --sessionId SESSIONID
```

## `leapp session change-region`

Change a session region

```
USAGE
  $ leapp session change-region [--sessionId <value>] [--region <value>]

FLAGS
  --region=<value>     Session Region for session in Leapp, use it for both AWS Region and Azure Location
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Change a session region

EXAMPLES
  $leapp session change-region

  $leapp session change-region --sessionId SESSIONID --region REGION
```

## `leapp session current`

Provides info about the current active session for a selected profile (if no profile is provided it uses default profile)

```
USAGE
  $ leapp session current [-i] [-p <value>] [-r aws|azure] [-f <value>]

FLAGS
  -f, --format=<value>     allows formatting data to show
                           - aws -> id alias, accountNumber, roleArn
                           - azure -> id tenantId, subscriptionId
  -i, --inline
  -p, --profile=<value>    [default: default] aws named profile of which gets info
  -r, --provider=<option>  filters sessions by the cloud provider service
                           <options: aws|azure>

DESCRIPTION
  Provides info about the current active session for a selected profile (if no profile is provided it uses default
  profile)

EXAMPLES
  $leapp session current --format "alias accountNumber" --inline --provider aws
```

## `leapp session delete`

Delete a session

```
USAGE
  $ leapp session delete [--sessionId <value>] [-f]

FLAGS
  -f, --force          force a command without asking for confirmation (-f, --force)
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Delete a session

EXAMPLES
  $leapp session delete

  $leapp session delete --sessionId SESSIONID

  $leapp session delete --sessionId SESSIONID [--force, -f]
```

## `leapp session generate SESSIONID`

Generate STS temporary credentials for the given AWS session id

```
USAGE
  $ leapp session generate [SESSIONID]

ARGUMENTS
  SESSIONID  id of the session

DESCRIPTION
  Generate STS temporary credentials for the given AWS session id

EXAMPLES
  $leapp session generate 0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

## `leapp session get-id`

Get session id

```
USAGE
  $ leapp session get-id

DESCRIPTION
  Get session id

EXAMPLES
  $leapp session get-id
```

## `leapp session list`

Show sessions list

```
USAGE
  $ leapp session list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --csv              output is csv format [alias: --output=csv]
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --output=<option>  output in a more machine friendly format
                     <options: csv|json|yaml>
  --sort=<value>     property to sort by (prepend '-' for descending)

DESCRIPTION
  Show sessions list

EXAMPLES
  $leapp session list
```

## `leapp session open-web-console`

Open an AWS Web Console

```
USAGE
  $ leapp session open-web-console [--sessionId <value>]

FLAGS
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Open an AWS Web Console

EXAMPLES
  $leapp session open-web-console

  $leapp session open-web-console --sessionId SESSIONID
```

## `leapp session start`

Start a session

```
USAGE
  $ leapp session start [--sessionId <value>]

FLAGS
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Start a session

EXAMPLES
  $leapp session start

  $leapp session start --sessionId SESSIONID
```

## `leapp session start-ssm-session`

Start an AWS SSM session

```
USAGE
  $ leapp session start-ssm-session [--sessionId <value>] [--region <value>] [--ssmInstanceId <value>]

FLAGS
  --region=<value>         Session Region for session in Leapp, use it for both AWS Region and Azure Location
  --sessionId=<value>      Session Id to identify the session in Leapp, recover it with $leapp session list -x
  --ssmInstanceId=<value>  Instance ID for EC2 instance we want to access with SSM

DESCRIPTION
  Start an AWS SSM session

EXAMPLES
  $leapp session start-ssm-session

  $leapp session start-ssm-session --sessionId SESSIONID --region AWSREGION --ssmInstanceId EC2INSTANCEID
```

## `leapp session stop`

Stop a session

```
USAGE
  $ leapp session stop [--sessionId <value>]

FLAGS
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Stop a session

EXAMPLES
  $leapp session stop

  $leapp session stop --sessionId SESSIONID
```
<!-- commandsstop -->
