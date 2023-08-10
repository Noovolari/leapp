`leapp session`
===============

Sessions management

* [`leapp session add`](#leapp-session-add)
* [`leapp session change-profile`](#leapp-session-change-profile)
* [`leapp session change-region`](#leapp-session-change-region)
* [`leapp session current`](#leapp-session-current)
* [`leapp session delete`](#leapp-session-delete)
* [`leapp session generate SESSIONID`](#leapp-session-generate-sessionid)
* [`leapp session get-id`](#leapp-session-get-id)
* [`leapp session list`](#leapp-session-list)
* [`leapp session open-web-console`](#leapp-session-open-web-console)
* [`leapp session run-aws-credential-plugin`](#leapp-session-run-aws-credential-plugin)
* [`leapp session start [SESSIONNAME]`](#leapp-session-start-sessionname)
* [`leapp session start-ssm-session`](#leapp-session-start-ssm-session)
* [`leapp session stop [SESSIONNAME]`](#leapp-session-stop-sessionname)

## `leapp session add`

Add a new session

```
USAGE
  $ leapp session add [--providerType aws] [--accessKey <value>] [--idpArn <value>] [--idpUrl <value>]
    [--mfaDevice <value>] [--sessionName <value>] [--parentSessionId <value>] [--profileId <value>] [--region <value>]
    [--roleArn <value>] [--roleSessionName <value>] [--secretKey <value>] [--sessionType
    awsIamRoleFederated|awsIamUser|awsIamRoleChained]

FLAGS
  --accessKey=<value>        AWS Access Key ID of the IAM User
  --idpArn=<value>           AWS IAM Federated Role IdP Arn value, obtain it from your AWS Account
  --idpUrl=<value>           the idp url address we want to create
  --mfaDevice=<value>        MFA Device Arn retrieved from your AWS Account
  --parentSessionId=<value>  For AWS IAM Role Chained is the session Id of the session that will assume the chained
                             role. Retrieve it using $leapp session list -x
  --profileId=<value>        an AWS named profile ID in Leapp
  --providerType=<option>    Identify the provider for your sessions. Valid types are [aws]
                             <options: aws>
  --region=<value>           Session Region for AWS sessions in Leapp
  --roleArn=<value>          AWS IAM Federated Role Arn value, obtain it from your AWS Account
  --roleSessionName=<value>  Optional Alias for the Assumed Role Session name
  --secretKey=<value>        AWS Secret Access Key of the IAM User
  --sessionName=<value>      Session Alias to identify the session in Leapp
  --sessionType=<option>     Identify the AWS session type. Valid types are [awsIamRoleFederated, awsIamUser,
                             awsIamRoleChained]
                             <options: awsIamRoleFederated|awsIamUser|awsIamRoleChained>

DESCRIPTION
  Add a new session

EXAMPLES
  $leapp session add

  $leapp session add --providerType [aws] --sessionType [awsIamRoleFederated, awsIamRoleChained, awsIamUser] --region [AWSREGION] --sessionName NAME ...[combination of flags relative to the session]

  $leapp session add --providerType aws --sessionType awsIamRoleFederated --sessionName NAME --region AWSREGION --idpArn IDPARN --idpUrl IDPURL --profileId PROFILEID --roleArn ROLEARN

  $leapp session add --providerType aws --sessionType awsIamRoleChained --sessionName NAME --region AWSREGION --profileId PROFILEID --roleArn ROLEARN --parentSessionId ID (--roleSessionName ROLESESSIONNAME)

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
  --region=<value>     Session Region for AWS sessions in Leapp
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Change a session region

EXAMPLES
  $leapp session change-region

  $leapp session change-region --sessionId SESSIONID --region REGION
```

## `leapp session current`

Provides info about the current active session for a selected profile (if no profile is provided, it uses the profile default)

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
  Provides info about the current active session for a selected profile (if no profile is provided, it uses the profile
  default)

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
  $ leapp session generate SESSIONID

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

Show sessions list with all properties; filter query is case sensitive

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
  Show sessions list with all properties; filter query is case sensitive

EXAMPLES
  $leapp session list

  $leapp session list --filter="ID=Foo" -x

  $leapp session list --filter="Session Name=Foo"

  $leapp session list --filter="Type=Foo"

  $leapp session list --filter="Named Profile=Foo"

  $leapp session list --filter="Region/Location=Foo"

  $leapp session list --filter="Status=Foo"
```

## `leapp session open-web-console`

Open an AWS Web Console

```
USAGE
  $ leapp session open-web-console [--sessionId <value>] [-p]

FLAGS
  -p, --print          Print an AWS Web Console login URL in the terminal instead of opening the web browser
  --sessionId=<value>  Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Open an AWS Web Console

EXAMPLES
  $leapp session open-web-console

  $leapp session open-web-console --sessionId SESSIONID [--print, -p]
```

## `leapp session run-aws-credential-plugin`

Run a Leapp Plugin

```
USAGE
  $ leapp session run-aws-credential-plugin [--sessionId <value>] [--pluginName <value>]

FLAGS
  --pluginName=<value>  Unique name of a Leapp Plugin
  --sessionId=<value>   Session Id to identify the session in Leapp, recover it with $leapp session list -x

DESCRIPTION
  Run a Leapp Plugin

EXAMPLES
  $leapp session run-plugin

  $leapp session run-plugin --sessionName SESSIONAME --pluginName PLUGINNAME
```

## `leapp session start [SESSIONNAME]`

Start a session

```
USAGE
  $ leapp session start [SESSIONNAME] [--sessionId <value>] [--sessionRole <value>] [--noInteractive]

ARGUMENTS
  SESSIONNAME  Name of the Leapp session

FLAGS
  --noInteractive        If the specified session is not unique or doesn't exist, throw an error without starting the
                         interactive session selection mode
  --sessionId=<value>    Session Id to identify the session in Leapp, recover it with $leapp session list -x
  --sessionRole=<value>  Session Role of one or more sessions in Leapp

DESCRIPTION
  Start a session

EXAMPLES
  $leapp session start

  $leapp session start SESSIONNAME

  $leapp session start SESSIONNAME --sessionRole SESSIONROLE

  $leapp session start SESSIONNAME --noInteractive

  $leapp session start --sessionId SESSIONID
```

## `leapp session start-ssm-session`

Start an AWS SSM session

```
USAGE
  $ leapp session start-ssm-session [--sessionId <value>] [--region <value>] [--ssmInstanceId <value>]

FLAGS
  --region=<value>         Session Region for AWS sessions in Leapp
  --sessionId=<value>      Session Id to identify the session in Leapp, recover it with $leapp session list -x
  --ssmInstanceId=<value>  Instance ID for EC2 instance we want to access with SSM

DESCRIPTION
  Start an AWS SSM session

EXAMPLES
  $leapp session start-ssm-session

  $leapp session start-ssm-session --sessionId SESSIONID --region AWSREGION --ssmInstanceId EC2INSTANCEID
```

## `leapp session stop [SESSIONNAME]`

Stop a session

```
USAGE
  $ leapp session stop [SESSIONNAME] [--sessionId <value>] [--sessionRole <value>] [--noInteractive]

ARGUMENTS
  SESSIONNAME  Name of the Leapp session

FLAGS
  --noInteractive        If the specified session is not unique or doesn't exist, throw an error without starting the
                         interactive session selection mode
  --sessionId=<value>    Session Id to identify the session in Leapp, recover it with $leapp session list -x
  --sessionRole=<value>  Session Role of one or more sessions in Leapp

DESCRIPTION
  Stop a session

EXAMPLES
  $leapp session stop

  $leapp session stop SESSIONNAME

  $leapp session stop SESSIONNAME --sessionRole SESSIONROLE

  $leapp session stop SESSIONNAME --noInteractive

  $leapp session stop --sessionId SESSIONID
```
