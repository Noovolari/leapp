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

You can install Leapp CLI through a Homebrew Formula:

```console
$ brew install Noovolari/brew/leapp-cli
```

In Linux it may happen that the command ```leapp``` is not recognized. In that case we suggest to run the following
command:

```console
$ brew link leapp-cli
```

## Install Leapp CLI on macOS with ARM64 chip (M1, M2)

On macOS with ARM64 chip you can use the Homebrew Formula:

```console
$ brew install Noovolari/brew/leapp-cli-darwin-arm64
```

All the available commands are listed in the [Leapp CLI section of the documentation](../../cli).

!!! warning

    Leapp CLI will work only if the Desktop App is installed and running.
