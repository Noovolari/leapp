`leapp idp-url`
===============

SAML 2.0 Identity providers URL management

* [`leapp idp-url create`](#leapp-idp-url-create)
* [`leapp idp-url delete`](#leapp-idp-url-delete)
* [`leapp idp-url edit`](#leapp-idp-url-edit)
* [`leapp idp-url list`](#leapp-idp-url-list)

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

_See code: [src/commands/idp-url/create.ts](https://github.com/noovolari/leapp/blob/v0.1.65/src/commands/idp-url/create.ts)_

## `leapp idp-url delete`

Delete an identity provider URL

```
USAGE
  $ leapp idp-url delete [--idpUrlId <value>] [-f]

FLAGS
  -f, --force             force a command without asking for confirmation (-f, --force)
      --idpUrlId=<value>  the idp url id that we want to pass to the function like the delete one

DESCRIPTION
  Delete an identity provider URL

EXAMPLES
  $leapp idp-url delete

  $leapp idp-url delete --idpUrlId ID

  $leapp idp-url delete --idpUrlId ID [--force, -f]
```

_See code: [src/commands/idp-url/delete.ts](https://github.com/noovolari/leapp/blob/v0.1.65/src/commands/idp-url/delete.ts)_

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

_See code: [src/commands/idp-url/edit.ts](https://github.com/noovolari/leapp/blob/v0.1.65/src/commands/idp-url/edit.ts)_

## `leapp idp-url list`

Show identity providers list

```
USAGE
  $ leapp idp-url list [--columns <value> | -x] [--sort <value>] [--filter <value>] [--output csv|json|yaml |  |
    [--csv | --no-truncate]] [--no-header | ]

FLAGS
  -x, --extended         show extra columns
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

_See code: [src/commands/idp-url/list.ts](https://github.com/noovolari/leapp/blob/v0.1.65/src/commands/idp-url/list.ts)_
