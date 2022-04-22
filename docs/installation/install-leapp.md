## Install Leapp App

### MacOS, Windows, and Linux

You can install Leapp by downloading the pre-built binaries for your OS on the website release page

[Download Leapp :fontawesome-solid-download:](https://www.leapp.cloud/releases){ .md-button .md-button--primary }


**Unzip** the package and **double-click the executable** to install.

### macOS (Homebrew) & Linux (Linuxbrew)

Leapp can also be installed on **macOS** or **Linux** via [Homebrew Cask](https://brew.sh/) with:
```console
$ brew install leapp
```

!!! info

    In addition, Leapp can also be installed with Linuxbrew on Windows via [WSL](https://docs.microsoft.com/en-us/windows/wsl/about)


## Install Leapp CLI

You can install Leapp CLI from [npm](https://www.npmjs.com/package/@noovolari/leapp-cli), installing it as a global package. 

```console
$ npm install -g @noovolari/leapp-cli
```

In macOS, you can install Leapp CLI through a Homebrew Formula:

```console
$ brew install Noovolari/brew/leapp-cli
```

OR

```console
$ brew tap Noovolari/brew && brew install leapp-cli
```

All the available commands are listed in the [Leapp CLI section of the documentation](../../cli).

!!! warning

    Leapp CLI will works only if the Desktop App is installed and running.
