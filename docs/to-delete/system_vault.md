# Vault Strategy
We use [Keytar](https://github.com/atom/node-keytar) as a library to maintain a secure vault for sensitive data.

### Prerequisite for using on Linux systems
Currently this library uses `libsecret` so you **may** need to install it before running Leapp.
Depending on your distribution, you will need to run the following command:

- Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
- Red Hat-based: `sudo yum install libsecret-devel`
- Arch Linux: `sudo pacman -S libsecret`

## How can I find Leapp data in the Vault?
Every key stored by Leapp in the vault is named **Leapp**. The account name shows the description of the element saved by our software.

## How Keytar translate to system vaults?
Keytar translate to the following system vaults depending on the OS:

* On **macOS** the passwords are managed by the *Keychain*.
* On **Linux** they are managed by the Secret Service *API/libsecret*.
* On **Windows** they are managed by *Credential Vault*.
