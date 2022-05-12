`leapp integration`
===================

Leapp Integrations management

* [`leapp integration create`](#leapp-integration-create)
* [`leapp integration delete`](#leapp-integration-delete)
* [`leapp integration list`](#leapp-integration-list)
* [`leapp integration login`](#leapp-integration-login)
* [`leapp integration logout`](#leapp-integration-logout)
* [`leapp integration sync`](#leapp-integration-sync)
* [`leapp integration sync-pro`](#leapp-integration-sync-pro)

## `leapp integration create`

Create a new AWS SSO integration

```
USAGE
  $ leapp integration create [--integrationAlias <value>] [--integrationPortalUrl <value>] [--integrationRegion <value>]
    [--integrationMethod <value>]

FLAGS
  --integrationAlias=<value>      alias that identifies an integration
  --integrationMethod=<value>     value is either In-app or In-browser, identifies the preferred method to authenticate
                                  against portal URL
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

## `leapp integration sync-pro`

Synchronize Leapp-PRO integration sessions

```
USAGE
  $ leapp integration sync-pro

DESCRIPTION
  Synchronize Leapp-PRO integration sessions

EXAMPLES
  $leapp integration pro sync
```
