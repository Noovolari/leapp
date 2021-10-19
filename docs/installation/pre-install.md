#Pre-install

There are not any requirements for MacOS and Windows user.

## Pre-requisite for using on Linux systems
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
