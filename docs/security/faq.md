## I'm using the open-source app, do you store my data online?
**NO.**

The open-source software don't transmit, persist, or share anything with other services. All your data are secured and encrypted on your workstation.

Nobody can access it, not even ourselves.

## I've a paid tier, how do you manage my data? Can you access it?

**We can't and don't want to see any of your access data.**

We need to store your data online for delivering few features (syncing, managing other users, etc.) but we will implement a [Zero Knowledge]() encryption system that will prevent even ourselves to access your data.

## Can someone else access my data?
**NO.**

All the information you put in Leapp are stored encrypted inside your workstation. Nothing is saved or transmitted online.

## I don't feel secure using a built-in window for authentication, can't you use the default browser?
In the future Leapp will only use the default browser to authenticate. Right now it's a compromise to deliver the authentication flow. We already ported AWS SSO authentication flow on the default browser, and we're working toward migrating the other ones.

## How can I find Leapp data in the System Vault?

Every key stored by Leapp in the vault is named Leapp. The account name shows the description of the element saved by our software.
