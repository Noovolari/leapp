`leapp region`
==============

Leapp regions management

* [`leapp region get-default`](#leapp-region-get-default)
* [`leapp region set-default`](#leapp-region-set-default)

# `leapp region get-default`

Displays the default region

```console
USAGE
  $ leapp region get-default

DESCRIPTION
  Displays the default region

EXAMPLES
  $leapp region get-default
```

# `leapp region set-default`

Change the default region

```console
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
