Information that can be used, or potentially exploited, to gain access to cloud environments are stored in the System Vault, leveraging its own integrated encryption. The user can access at any time the secrets stored in the System Vault through its user password.

Leapp uses [Keytar](https://github.com/atom/node-keytar) as an interface to the secure vault on macOS, Windows and Linux systems.

## How can I find Leapp data in the Vault?

Every key stored by Leapp in the vault is named **Leapp**. The account name shows the description of the element saved by our software.

## What System Vaults are supported?

Keytar act as an interface to the following system vaults, depending on the OS.

| OS      | System Vault     |
| ------- | ---------------- |
| MacOS   | Keychain         |
| Windows | Credential Vault    |
| Linux   | [API/Libsecret](https://wiki.gnome.org/Projects/Libsecret) | 
