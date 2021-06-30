Leapp
=========
[![Github All Releases](https://img.shields.io/github/downloads/noovolari/leapp/latest/total)](https://github.com/Noovolari/leapp/releases/latest)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Noovolari/leapp.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Noovolari/leapp/context:javascript)
- Website: https://www.leapp.cloud/
- Roadmap: [Roadmap](https://github.com/Noovolari/leapp/projects/4)
- Wiki: [Wiki](https://github.com/Noovolari/leapp/wiki)
- Chat with us: [Slack](https://join.slack.com/t/noovolari/shared_invite/zt-opn8q98k-HDZfpJ2_2U3RdTnN~u_B~Q)

![logo](.github/images/README-1.png)

Leapp is a Cross-Platform Cloud access App, built on top of [Electron](https://github.com/electron/electron).

The App is designed to **manage and secure Cloud Access in multi-account environments.**

![Securing aws Credentials on DevOps machines 001](https://user-images.githubusercontent.com/9497292/114399348-1e942f80-9ba1-11eb-8b4a-74b60bd29189.jpeg)

# Key features

> We Strongly believe that access information to Cloud in `~/.aws` or `~/.azure` files are not safe, and **[we prefer to store that information in an encrypted file managed by the system.](https://github.com/Noovolari/leapp/wiki/vault-strategy)**
> Credentials will be hourly rotated and accessible in those files only when they are needed, so only when Leapp is active.


- **Switch Cloud Profile in a click**
  
- **[Secure](https://github.com/Noovolari/leapp/wiki/vault-strategy) repository for your access data**

- **Multiple Cloud-Access [strategies](https://github.com/Noovolari/leapp/wiki/use-cases)**

- **[No long-lived](https://github.com/Noovolari/leapp/wiki/rotating-credentials) credentials**

- **Generate and use sessions directly from [your aws Organization](https://github.com/Noovolari/leapp/wiki/use-cases#aws-single-sign-on)**

- **Connect EC2 instances straight away**

All the covered access methods can be found [here](https://github.com/Noovolari/leapp/wiki/use-cases).


![Leapp App animation](.github/images/Leapp-animation.gif)


# Installation
Get [here](https://www.leapp.cloud/releases) the latest release.

# Contributing

Please read through our [contributing guidelines](.github/CONTRIBUTING.md) and [code of conduct](.github/CODE_OF_CONDUCT.md). Included are directions
for opening issues, coding standards, and notes on development.

Editor preferences are available in the [editor config](.editorconfig) for easy use in
common text editors. Read more and download plugins at [editorconfig.org](http://editorconfig.org).

# Developing

Development on Leapp can be done on Mac, Windows, or Linux as long as you have
[NodeJS](https://nodejs.org) and [Git](https://git-scm.com/). See the `.nvmrc` file located in the project for the correct Node version.

<details>
<summary>Initial Dev Setup</summary>

This repository is structured as a monorepo and contains many Node.JS packages. Each package has
its own set of commands, but the most common commands are available from the
root [`package.json`](package.json) and can be accessed using the `npm run ...` command. Here
are the only three commands you should need to start developing on the app.

```bash
# Install and Link Dependencies
npm install


# Start App without Live Reload
npm run electron-dev
```

If Electron is failing building the native Library `Keytar` just run before `npm run electron-dev`:
```bash
# Clear Electron and Keytar conflicts
npm run rebuild-keytar
```

</details>

<details>
<summary>Editor Requirements</summary>

You can use any editor you'd like, but make sure to have support/plugins for
the following tools:

- [ESLint](http://eslint.org/) – For catching syntax problems and common errors

</details>

# Logs
By default, Leapp writes logs to the following locations:

- on Linux: `~/.config/Leapp/logs/log.log`
- on macOS: `~/Library/Logs/Leapp/log.log`
- on Windows: `%USERPROFILE%\\AppData\\Roaming\\Leapp\\log.log`
Logs are structured in the following way:
```
[YYYY-MM-DD HH:mm:ss.mmm] [LEVEL] [rendered/system] [COMPONENT] MESSAGE {Useful Object / Stacktrace Err Object}
```
*Note: please always add logs whenever possible to any issue you want to fill to enable the team identify the problem quickly*

# Documentation
Here you can find our [documentation](https://github.com/Noovolari/leapp/wiki).

# Links
- [Glossary](.github/GLOSSARY.md): find other information about the system
- [Roadmap](https://github.com/Noovolari/leapp/projects/4): view our next steps and stay up to date
- [Contributing](./.github/CONTRIBUTING.md): follow the guidelines if you'd like to contribute to the project
- [Project Structure](./.github/PROJECT_STRUCTURE.md): check how we structured the project and where to find the files
# License
[Mozilla Public License v2.0](https://github.com/Noovolari/leapp/blob/master/LICENSE)
