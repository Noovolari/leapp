# Overview

## Welcome to Leapp :rocket:

Leapp is a tool for developers to manage, secure, and access to the Cloud.

Leapp information needed to retrieve credentials are stored **LOCALLY** inside his [workspace](concepts.md). Critical information such as Cloud secrets and token are stored inside the **System Vault**.

![Leapp Main Window](images/main-window.png?style=center-img)

The name **Leapp** is inspired by the English word *leap* and pronounced */l:ip/*. We choose this name because the project enables you to be one step away from your cloud environments.


## Installing

You can install Leapp by downloading the pre-built binaries for your OS [here](https://www.leapp.cloud/releases).

Unzip the package and double-click on the executable to install.

### macOS (Homebrew) & Linux (Linuxbrew)

There exists a [Homebrew](https://brew.sh/) Cask for Leapp which can be installed with:
`brew install leapp`

### Prerequisite for using on Linux systems
Currently, we have `libsecret` and `gnome-keyring` as dependencies to store all sensitive data into the keyring; you **may** need to install them before running Leapp.
Depending on your distribution, you will need to run the following command:

* Debian/Ubuntu:
    - `sudo apt-get install gnome-keyring`
    - `sudo apt-get install libsecret-1-dev`
* Red Hat-based:
    - `sudo yum install gnome-keyring`
    - `sudo yum install libsecret-devel`
* Arch Linux:
    - `sudo pacman -S gnome-keyring`
    - `sudo pacman -S libsecret`

## Logs

By default, Leapp writes logs to the following locations:

- on Linux: `~/.config/Leapp/log.log`
- on macOS: `~/Library/Logs/Leapp/log.log`
- on Windows: `%USERPROFILE%\\AppData\\Roaming\\Leapp\\log.log`
  Logs are structured in the following way:
```
[YYYY-MM-DD HH:mm:ss.mmm] [LEVEL] [rendered/system] [COMPONENT] MESSAGE {Useful Object / Stacktrace Err Object}
```
> *Note: please always add logs whenever possible to any issue you want to fill to enable the team identify the problem quickly*
