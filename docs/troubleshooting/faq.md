## I'm using the open-source app, do you store my data online?
**NO.**

The open-source software don't transfer, persist, or share anything with other services. All your data is secured and encrypted on your workstation.

**Nobody can access it, not even ourselves.**

## I've got a paid tier, how do you manage my data? Can you access it?

**We can't and don't want to see any of your access data.**

We need to store your data online to enable some features (syncing, managing other users, etc.) but we implement a [Zero-Knowledge](/0.9.0/security/zero-knowledge) encryption system that prevents even ourselves to access your data.

## I don't feel secure using a built-in window for authentication, can't you use the default browser?

In the future, Leapp will only use the default browser to authenticate. Right now, this is a compromise to deliver the authentication flow. We already ported the AWS SSO authentication flow on the default browser, and we're working on migrating the other ones as soon as possible.

## How can I find Leapp data in the System Vault?

Every key stored by Leapp in the vault is named Leapp. The account name shows the description of the element saved by our software.

## Where do I find the Leapp logs?

Head to the [Application data section](app-data.md).

## SSM terminal is opening but no session is starting, what can I do?

Just close the terminal and relaunch the SSM command.
