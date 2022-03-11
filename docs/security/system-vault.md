Information that can be used, or potentially exploited, to gain access to cloud environments are stored your workstation's System Vault, leveraging its own integrated encryption. The user can access the secrets stored in the System Vault at any time, using their user password.

Leapp uses [Keytar](https://github.com/atom/node-keytar) as an interface to the secure vault on macOS, Windows and Linux systems.

Every key is stored in the vault under the name **Leapp**, in the description you will find the underlying name used by Leapp to retrieve the secret.

## Supported System Vaults

| OS      | System Vault     |
| ------- | ---------------- |
| MacOS   | Keychain         |
| Windows | Credential Vault    |
| Linux   | [API/Libsecret](https://wiki.gnome.org/Projects/Libsecret) | 

!!! Info
    
    We're currently supporting only System Vaults installed by default on the OS. We're planning on extending support to other vaults and online password managers (LastPass, BitWarden, 1Password, etc.). 
    If you'd like other services to be supported feel free to [open an Issue](https://github.com/Noovolari/leapp/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=) or make a Pull Request (check our [contributing guidelines](../../contributing/get-involved)). 

