`leapp integration`
===================

Leapp Integrations management

* [`leapp integration create`](#leapp-integration-create)
* [`leapp integration delete`](#leapp-integration-delete)
* [`leapp integration list`](#leapp-integration-list)
* [`leapp integration login`](#leapp-integration-login)
* [`leapp integration logout`](#leapp-integration-logout)
* [`leapp integration sync`](#leapp-integration-sync)

## `leapp integration create`

Create a new AWS SSO integration

```console
USAGE
  $ leapp integration create

DESCRIPTION
  Create a new AWS SSO integration

EXAMPLES
  $leapp integration create
```

## `leapp integration delete`

Delete an integration

```console
USAGE
  $ leapp integration delete

DESCRIPTION
  Delete an integration

EXAMPLES
  $leapp integration delete
```

## `leapp integration list`

Show integrations list

```console
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

```console
USAGE
  $ leapp integration login

DESCRIPTION
  Login to synchronize integration sessions

EXAMPLES
  $leapp integration login
```

## `leapp integration logout`

Logout from integration

```console
USAGE
  $ leapp integration logout

DESCRIPTION
  Logout from integration

EXAMPLES
  $leapp integration logout
```

## `leapp integration sync`

Synchronize integration sessions

```console
USAGE
  $ leapp integration sync

DESCRIPTION
  Synchronize integration sessions

EXAMPLES
  $leapp integration sync
```
