`leapp profile`
===============

Leapp AWS Multi-profile management

* [`leapp profile create`](#leapp-profile-create)
* [`leapp profile delete`](#leapp-profile-delete)
* [`leapp profile edit`](#leapp-profile-edit)
* [`leapp profile list`](#leapp-profile-list)

## `leapp profile create`

Create a new AWS named profile

```console
USAGE
  $ leapp profile create

DESCRIPTION
  Create a new AWS named profile

EXAMPLES
  $leapp profile create
```

## `leapp profile delete`

Delete an AWS named profile

```console
USAGE
  $ leapp profile delete

DESCRIPTION
  Delete an AWS named profile

EXAMPLES
  $leapp profile delete
```

## `leapp profile edit`

Rename an AWS named profile

```console
USAGE
  $ leapp profile edit

DESCRIPTION
  Rename an AWS named profile

EXAMPLES
  $leapp profile edit
```

## `leapp profile list`

Show profile list

```console
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
