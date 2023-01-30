## I'm using the open-source app, do you store my data online?
**NO.**

The open-source software don't transfer, persist, or share anything with other services. All your data is secured and encrypted on your workstation.

**Nobody can access it, not even ourselves.**

## I've got a paid tier, how do you manage my data? Can you access it?

**We can't and don't want to see any of your access data.**

We need to store your data online to enable some features (syncing, managing other users, etc.) but we implement a [Zero-Knowledge](../../security/zero-knowledge/){: target='_blank'} encryption system that prevents even ourselves to access your data.

## I don't feel secure using a built-in window for authentication, can't you use the default browser?

In the future, Leapp will only use the default browser to authenticate. Right now, this is a compromise to deliver the authentication flow. We already ported the AWS SSO authentication flow on the default browser, and we're working on migrating the other ones as soon as possible.

## How can I find Leapp data in the System Vault?

Every key stored by Leapp in the vault is named Leapp. The account name shows the description of the element saved by our software.

## Where do I find the Leapp logs?

Head to the [Application data section](app-data.md).

## SSM terminal is opening but no session is starting, what can I do?

Just close the terminal and relaunch the SSM command.

## AWS CLI (or AZ CLI) is installed but Leapp can't find it, what can I do?

Leapp on macOS works in sandbox mode, so some terminal commands must be symlinked in order to work on some installations.
Just make a symlink pointing from `/usr/local/bin/aws` to the actual `aws` binary or, for AZ CLI, from `/usr/local/bin/az` to the actual `az` binary. To create
symlinks on macOS, use this command `ln -s /any/file/on/the/disk linked-file`. The command is called **ln**. If used with the 
option **-s** it will create a symbolic link in the current directory.

Examples:
```
ln -s /path/to/my/aws /usr/local/bin/aws
ln -s /path/to/my/az /usr/local/bin/az
```

## How can I add support to a new SAML 2.0 Identity Provider?

To add support tu a new SAML 2.0 Identity Provider, you have to perform the following steps:

* create a [Fork](https://github.com/Noovolari/leapp/fork) of the Noovolari/leapp GitHub repository;
* create a new Pull Request from your forked leapp GitHub repository;
* set up your local environment following '[Install dependencies and build packages](https://github.com/Noovolari/leapp/blob/master/DEVELOPMENT.md#development-environment-setup)' section of the DEVELOPMENT.md;
* add the Identity Provider-specific authentication URL RegEx filter to the Leapp Core [authenticationUrlRegexes](https://github.com/Noovolari/leapp/blob/beadb073ea99eb71cdf56982851604172bfdba0a/packages/core/src/services/aws-saml-assertion-extraction-service.ts) Map;
* follow the last part of the '[Install dependencies and build packages](https://github.com/Noovolari/leapp/blob/master/DEVELOPMENT.md#development-environment-setup)' section of the DEVELOPMENT.md to build the solution for both the CLI and the Desktop App;
* push your changes to your forked repository and propose to merge them to the main repository. 

If you need more details about the implementation, please check [this DEVELOPMENT.md section]().
