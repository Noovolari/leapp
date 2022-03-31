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
* [`leapp session start`](#leapp-session-start)
* [`leapp session start-ssm-session`](#leapp-session-start-ssm-session)
* [`leapp session stop`](#leapp-session-stop)

## `leapp session add`

Add a new session

```console
USAGE
  $ leapp session add

DESCRIPTION
  Add a new session

EXAMPLES
  $leapp session add
```

## `leapp session change-profile`

Change a session named-profile

```console
USAGE
  $ leapp session change-profile

DESCRIPTION
  Change a session named-profile

EXAMPLES
  $leapp session change-profile
```

## `leapp session change-region`

Change a session region

```console
USAGE
  $ leapp session change-region

DESCRIPTION
  Change a session region

EXAMPLES
  $leapp session change-region
```

## `leapp session current`

Provides info about the current active session for a selected profile (if no profile is provided it uses default profile)

```console
USAGE
  $ leapp session current [-i] [-p <value>] [-r aws|azure] [-f <value>]

FLAGS
  -f, --format=<value>     allows filtering data to show
                           - aws -> alias, accountNumber, roleArn
                           - azure -> tenantId, subscriptionId
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

```console
USAGE
  $ leapp session delete

DESCRIPTION
  Delete a session

EXAMPLES
  $leapp session delete
```

## `leapp session generate SESSIONID`

Generate temporary credentials for the given AWS session id

```console
USAGE
  $ leapp session generate [SESSIONID]

ARGUMENTS
  SESSIONID  id of the session

DESCRIPTION
  Generate temporary credentials for the given AWS session id

EXAMPLES
  $leapp session generate 0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

## `leapp session get-id`

Get session id

```console
USAGE
  $ leapp session get-id

DESCRIPTION
  Get session id

EXAMPLES
  $leapp session get_id
```

## `leapp session list`

Show sessions list

```console
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

```console
USAGE
  $ leapp session open-web-console

DESCRIPTION
  Open an AWS Web Console

EXAMPLES
  $leapp session open-web-console
```

## `leapp session start`

Start a session

```console
USAGE
  $ leapp session start

DESCRIPTION
  Start a session

EXAMPLES
  $leapp session start
```

## `leapp session start-ssm-session`

Start an AWS SSM session

```console
USAGE
  $ leapp session start-ssm-session

DESCRIPTION
  Start an AWS SSM session

EXAMPLES
  $leapp session start-ssm-session
```

## `leapp session stop`

Stop a session

```console
USAGE
  $ leapp session stop

DESCRIPTION
  Stop a session

EXAMPLES
  $leapp session stop
```
