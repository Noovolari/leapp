`leapp idp-url`
===============

SAML 2.0 Identity providers URL management

* [`leapp idp-url create`](#leapp-idp-url-create)
* [`leapp idp-url delete`](#leapp-idp-url-delete)
* [`leapp idp-url edit`](#leapp-idp-url-edit)
* [`leapp idp-url list`](#leapp-idp-url-list)

## `leapp idp-url create`

Create a new identity provider URL

```console
USAGE
  $ leapp idp-url create

DESCRIPTION
  Create a new identity provider URL

EXAMPLES
  $leapp idp-url create
```

## `leapp idp-url delete`

Delete an identity provider URL

```console
USAGE
  $ leapp idp-url delete

DESCRIPTION
  Delete an identity provider URL

EXAMPLES
  $leapp idp-url delete
```

## `leapp idp-url edit`

Edit an identity provider URL

```console
USAGE
  $ leapp idp-url edit

DESCRIPTION
  Edit an identity provider URL

EXAMPLES
  $leapp idp-url edit
```

## `leapp idp-url list`

Show identity providers list

```console
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
