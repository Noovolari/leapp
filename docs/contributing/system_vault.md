# Vault Strategy
We use [Keytar](https://github.com/atom/node-keytar) as a library to maintain a secure vault for sensitive data.

### Prerequisite for using on Linux systems
Currently this library uses `libsecret` so you **may** need to install it before running Leapp.
Depending on your distribution, you will need to run the following command:

- Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
- Red Hat-based: `sudo yum install libsecret-devel`
- Arch Linux: `sudo pacman -S libsecret`

### Supported versions for contributors
Each release of `keytar` includes prebuilt binaries for the versions of Node and Electron that are actively supported by our project.
Please refer to the release documentation for [Node](https://github.com/nodejs/Release) and [Electron](https://electronjs.org/docs/tutorial/support)
to see what is supported currently.

## Keytar documentation
Every function in `keytar` is **asynchronous** and returns a **Promise**. The promise will be rejected with any error that occurs or
will be resolved within the function's `yields` value.
In Leapp we use the three methods listed below to save and store sensible information and to **avoid** keeping them anywhere in the code.
The delete function is used when an **AWS Plain** session is **updated** or **removed** from the list.

### getPassword(service, account)
Get the stored password for the `service` and `account`.
`service` - The string service name.
`account` - The string account name.
Yields the string password or `null` if an entry for the given service and account was not found.

### setPassword(service, account, password)
Save the `password` for the `service` and `account` to the keychain. Adds a new entry if necessary, or updates an existing entry if one exists.
`service` - The string service name.
`account` - The string account name.
`password` - The string password.
Yields nothing.

### deletePassword(service, account)
Delete the stored password for the `service` and `account`.
`service` - The string service name.
`account` - The string account name.
Yields `true` if a password was deleted, or `false` if an entry with the given service and account was not found.

## How can I find Leapp data in the Vault?
Every key stored by Leapp in the vault is named **Leapp**. The account name shows the description of the element saved by our software.

## How Keytar translate to system vaults?
Keytar translate to the following system vaults depending on the OS:

* On **macOS** the passwords are managed by the *Keychain*.
* On **Linux** they are managed by the Secret Service *API/libsecret*.
* On **Windows** they are managed by *Credential Vault*.
