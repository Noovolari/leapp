# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.26.1](https://github.com/Noovolari/leapp/compare/v0.26.0...v0.26.1) (2024-06-05)

### Bug Fixes
* fixed Leapp Pro workspace export functionality: 
now it is able to keep IAM Users Access Keys in the system keychain during the transition to the local workspace.
Thanks to [Nuru](https://github.com/Nuru) for the support!

### [0.26.0](https://github.com/Noovolari/leapp/compare/v0.25.3...v0.26.0) (2024-05-13)

### Features
* added **Noovolari important communication** to command bar

### [0.25.3](https://github.com/Noovolari/leapp/compare/v0.25.2...v0.25.3) (2024-03-29)

### Bug Fixes
* fixed in-app AWS Identity Center Integration auth flow ([issue #540](https://github.com/Noovolari/leapp/issues/540)).

### [0.25.2](https://github.com/Noovolari/leapp/compare/v0.25.1...v0.25.2) (2024-03-07)

### Bug Fixes
* fixed CLI `leapp session start` "stream.pipe" error.

### [0.25.1](https://github.com/Noovolari/leapp/compare/v0.25.0...v0.25.1) (2024-03-05)

### Bug Fixes
* fixed AWS Identity Center logout flow

### [0.25.0](https://github.com/Noovolari/leapp/compare/v0.24.6...v0.25.0) (2024-02-29)

### Features
* migrated AWS SDK dependency from v2 to v3.

### [0.24.6](https://github.com/Noovolari/leapp/compare/v0.24.5...v0.24.6) (2024-02-06)

### Bug Fixes
* updated axios to v1.6.2 and wait-on to v7.2.0.

### [0.24.5](https://github.com/Noovolari/leapp/compare/v0.24.4...v0.24.5) (2024-02-05)

### Features
* now, if you're logged into a remote workspace (Pro/Team), you can export it from the option menu.

### Bug Fixes
* now, if a browser extension Leapp Session is expired, you can keep using that session by opening that again from Leapp.

### [0.24.4](https://github.com/Noovolari/leapp/compare/v0.24.3...v0.24.4) (2024-01-26)

### Features
* new Leapp Team feature: if you log into Leapp Team as a Manager user, you'll see only the Sessions that you've explicitly shared with that user.

### [0.24.3](https://github.com/Noovolari/leapp/compare/v0.24.2...v0.24.3) (2024-01-23)

### Bug Fixes
* quality of life fixes

### [0.24.2](https://github.com/Noovolari/leapp/compare/v0.24.1...v0.24.2) (2024-01-23)

### Features
* now Leapp Team workspaces display the account name and identity for each session

### Bug fixes
* fixed bug that prevented the default region to be used when importing sessions from Leapp Team

### [0.24.1](https://github.com/Noovolari/leapp/compare/v0.24.0...v0.24.1) (2024-01-15)

### Features
* added support to macOS Warp terminal [#510](https://github.com/Noovolari/leapp/pull/510). A special thanks to [@blyzer](https://github.com/blyzer)
* updated macOS build notarization method

### [0.24.0](https://github.com/Noovolari/leapp/compare/v0.23.1...v0.24.0) (2023-12-29)

### Features
* Now Leapp options relative to the pro/team workspace are saved.

### Bug fixes
* In the docs.leapp.cloud navigation sidebar, all the CLI commands are now visible
* Added [export profile script](https://docs.leapp.cloud/latest/usefull-scripts/export-profile) to the docs

### [0.23.1](https://github.com/Noovolari/leapp/compare/v0.23.0...v0.23.1) (2023-12-27)

### Bug fixes
* Solved Leapp Team configuration consistency bug; now, Leapp skips invalid sessions that are pulled from remote.

### [0.23.0](https://github.com/Noovolari/leapp/compare/v0.22.2...v0.23.0) (2023-12-13)

We are in early access! Our first company solution is now in early access and available for FREE.

### Features
* AWS SSO integration default opening type is now "in browser", if you're logged into Leapp Team.

### [0.22.2](https://github.com/Noovolari/leapp/compare/v0.22.1...v0.22.2) (2023-12-06)

### Bug fixes
* Performance improvement

### [0.22.1](https://github.com/Noovolari/leapp/compare/v0.22.0...v0.22.1) (2023-11-28)

### Bug fixes
* Performance improvement

### [0.22.0](https://github.com/Noovolari/leapp/compare/v0.21.0...v0.22.0) (2023-11-23)

### Features
Updated the following packages versions:
* axios from 1.4.0 to 1.6.1;
* axios from 0.27.2 to 1.6.0 in desktop-app;
* axios from 0.27.2 to 1.6.0 in cli;
* crypto-js from 4.1.1 to 4.2.0 in cli;
* crypto-js from 4.1.1 to 4.2.0 in desktop-app;
* @babel/traverse from 7.22.10 to 7.23.2 in desktop-app;
* @babel/traverse from 7.22.10 to 7.23.2 in cli;
* @babel/traverse from 7.22.8 to 7.23.2;
* electron from 22.3.24 to 22.3.25 in desktop-app.

### [0.21.0](https://github.com/Noovolari/leapp/compare/v0.20.2...v0.21.0) (2023-10-18)

### Features
* added support to dynamic "Assumer Session" field in AWS IAM Role Chained Sessions created in Leapp Team

### Bug fixes
* Leapp Team UX/UI adjustments

### [0.20.2](https://github.com/Noovolari/leapp/compare/v0.20.1...v0.20.2) (2023-10-05)

### Bug fixes
* fixed change the authentication URL regexp for Auth0 ([issue #475](https://github.com/Noovolari/leapp/issues/475)). Thanks to [@maintux](https://github.com/maintux)!
* fixed search common locations for binary ([issue #476](https://github.com/Noovolari/leapp/issues/476)). Thanks to [@icholi](https://github.com/icholy)!

### [0.20.1](https://github.com/Noovolari/leapp/compare/v0.20.0...v0.20.1) (2023-09-21)

### Features
* added support to AWS SSO authorization code with confirmation modal window

### [0.20.0](https://github.com/Noovolari/leapp/compare/v0.19.0...v0.20.0) (2023-09-14)

### Features
* added support to LocalStack! You can use Leapp to create a LocalStack session that can then be used to set your local credential file and access your LocalStack resources.
* added support to Touch ID; now, you can use your fingerprint to unlock Leapp Pro if you're using a Touch ID compatible macOS system.

### Bug fixes
* fixed AWS credentials file permission so that its owner only has full read and write access to the file
* fixed Leapp CLI bug that made it unstable

### [0.19.0](https://github.com/Noovolari/leapp/compare/v0.18.6...v0.19.0) (2023-09-04)

### Features
* Introducing Leapp Pro!
  * You can now **Protect your cloud access with Username and password**
  * **Login securely across multiple devices** and centralize your Cloud Access
  
  For more details, please check out the [docs](https://docs.leapp.cloud/latest/leapp-pro/getting-started/).

### [0.18.6](https://github.com/Noovolari/leapp/compare/v0.18.5...v0.18.6) (2023-09-01)

### Bug fixes
* Performance improvement

### [0.18.5](https://github.com/Noovolari/leapp/compare/v0.18.4...v0.18.5) (2023-08-10)

### Bug fixes
* fixed `HTTP 429 TooManyRequestsException` error generated during AWS SSO integration sync ([issue #459](https://github.com/Noovolari/leapp/issues/459))

### Features
* added AWS SSO integration sync loading screen
* SAML IdP keycloak `/auth` base path is now optional. Thanks to [@hugocortes](https://github.com/hugocortes) for the [Pull Request #428](https://github.com/Noovolari/leapp/pull/428)

### [0.18.4](https://github.com/Noovolari/leapp/compare/v0.18.3...v0.18.4) (2023-08-03)

### Bug fixes
* fixed IAM Federated session G Suite SAML authentication flow ([issue #453](https://github.com/Noovolari/leapp/issues/453))
### [0.18.3](https://github.com/Noovolari/leapp/compare/v0.18.2...v0.18.3) (2023-07-28)

### Bug fixes
* endpoint url fix

### [0.18.2](https://github.com/Noovolari/leapp/compare/v0.18.1...v0.18.2) (2023-07-28)

### Bug fixes
* fixed JumpCloud authentication URL regex bug(related to the [Pull Request #414](https://github.com/Noovolari/leapp/pull/414)). Thanks to [@adys](https://github.com/adys)!
* added support to me-central-1 AWS region. A special thanks to [@MattBlanco](https://github.com/MattBlanco) for the [Pull Request #446](https://github.com/Noovolari/leapp/pull/446)!
* fixed Leapp Team workspace expiration bug

### [0.18.1](https://github.com/Noovolari/leapp/compare/v0.18.0...v0.18.1) (2023-06-26)

### Features
* added support to JumpCloud as SAML IdP. Thanks to [@adys](https://github.com/adys) for the [Pull Request #414](https://github.com/Noovolari/leapp/pull/414)!
* added "leappalias command" setup in the docs FAQ section. Thanks to [@bspansinQdo](https://github.com/bspansinQdo) for the guide!

### [0.18.0](https://github.com/Noovolari/leapp/compare/v0.17.8...v0.18.0) (2023-06-21)

### Features
* introducing [Workspaces](https://docs.leapp.cloud/latest/workspaces/)! A global configuration that contains all the relevant information about your Leapp setup.
  You can now switch from Local to remote Workspaces.

### [0.17.8](https://github.com/Noovolari/leapp/compare/v0.17.7...v0.17.8) (2023-06-16)

### Bug fixes
* fixed dependencies as suggested by dependabot
* updated xml2js from 0.4.19 to 0.5.0
* updated aws-sdk from 2.928.0 to 2.1354.0

### [0.17.7](https://github.com/Noovolari/leapp/compare/v0.17.6...v0.17.7) (2023-06-14)

### Features
* added notifications menu located right to the search bar. Inside it, you can see in-app notifications.
  In addition, you can request a GitHub enhancement or join the community, directly from the app.
* added a survey in the notification menu to help us improving the product experience.

### [0.17.6](https://github.com/Noovolari/leapp/compare/v0.17.5...v0.17.6) (2023-05-11)

### Features
* added support to eu-central-2 and eu-south-2 AWS regions. A special thanks to [@DanielMuller](https://github.com/DanielMuller) for the contribution!

### [0.17.5](https://github.com/Noovolari/leapp/compare/v0.17.4...v0.17.5) (2023-05-08)

### Features
* added ability to select text in the search bar (and other text fields) using CMD/CTRL + a; this feature is available for macOS, Windows, and Linux.

### [0.17.4](https://github.com/Noovolari/leapp/compare/v0.17.3...v0.17.4) (2023-02-28)

To have access to the following Leapp CLI feature, please download the latest Leapp CLI 0.1.32 version.
To update it, refer to our [documentation](https://docs.leapp.cloud/latest/installation/update-leapp/#cli).

### Features
* now it is also possible to start a Leapp Session from the CLI by specifying the session name and/or the session role; this is possible using both interactive and non-interactive mode.

### [0.17.3](https://github.com/Noovolari/leapp/compare/v0.17.2...v0.17.3) (2023-02-14)

### Bug Fixes
* migrated oclif/core to v2.1.4 to fix [issue #389](https://github.com/Noovolari/leapp/issues/389)
* fixed dot-delimited named profiles reported in [issue #392](https://github.com/Noovolari/leapp/issues/392)

### [0.17.2](https://github.com/Noovolari/leapp/compare/v0.17.1...v0.17.2) (2023-01-30)

### Features
* added support for the ap-southeast-4 region [#386](https://github.com/Noovolari/leapp/issues/386)
* added examples for the Leapp CLI list --filter option. They will be available in docs.leapp.cloud, under the CLI section.
* updated crypto-js to 4.1.1

### [0.17.1](https://github.com/Noovolari/leapp/compare/v0.17.0...v0.17.1) (2023-01-10)

### Features
* added support for Keycloak IdP [#374](https://github.com/Noovolari/leapp/issues/374)
  <br><br>
  You can now create an AWS IAM role federated session using Keycloak as an identity provider.
  <br><br>
  A special thanks to [@patlachance](https://github.com/patlachance) for the contribution!

### [0.17.0](https://github.com/Noovolari/leapp/compare/v0.16.2...v0.17.0) (2022-12-23)

### Features
* added configurable default webconsole timeout with [#319](https://github.com/Noovolari/leapp/pull/319) PR.
  <br><br>
  A new option is added in the general options with which the default webconsole
  timeout can be configured between 1 hour and 12 hours.
  <br><br>
  Configurable duration will now also apply to the IAM Role Federated Service.
  <br><br>
  A special thanks to [@RaviBri](https://github.com/RaviBri) for the contribution!
  <br><br>
* updated Multi-Console Browser Extension documentation

### Bug Fixes

* fixed [#360](https://github.com/Noovolari/leapp/issues/360) issue with [#361](https://github.com/Noovolari/leapp/pull/361) PR.
  <br><br>
  The PR fixes the case when the region for AWS SSO changes
  and the client isn't aware, leading to the "Session token not found
  or invalid" error.
  <br><br>
  It adds a check to see if the clients' region is different to the
  integration one and so recreate the client.
  <br><br>
  A special thanks to [@rusowyler](https://github.com/rusowyler) for the contribution!
  <br><br>
* added missing plugins initialization when running a CLI command with flags
* fixed dependencies security issues (gushio and electron-builder are still moderate)

### [0.16.2](https://github.com/Noovolari/leapp/compare/v0.16.1...v0.16.2) (2022-11-15)

### Features

* merged the open web console methods in a single menu action. Now you can set your favourite method from the Multi-Console tab in the option menu and choose between the
  standard method or to use the extension (with a fallback to the standard method if any error occurs)
* added a shortcut to the open web console action. Now you can use Command + left click (or Control + left click on Windows/Linux) to open it with a single click

### Bug Fixes

* fixed a bug with the dark theme showing the active icon of a session with the wrong color if the session is selected
* introduced a SAML authentication timeout handler to avoid hanging sessions

### [0.16.1](https://github.com/Noovolari/leapp/compare/v0.16.0...v0.16.1) (2022-11-09)

### Features

* added support for reusable Firefox Containers/Chrome Tabs

### Bug Fixes

* disabled IAM User "Open Web Console" and "Open Multi-Console Extension" actions

### [0.16.0](https://github.com/Noovolari/leapp/compare/v0.15.2...v0.16.0) (2022-11-02)

### Features

* added AWS multi-console support. Now it is possible to open multiple AWS consoles in the same browser window by installing
  the Leapp browser extension available for Firefox, Chrome, Edge and other Chromium-based browser. To learn more, see the [docs](https://docs.leapp.cloud/0.16.0/built-in-features/multi-console/).

### Bug Fixes

* updated Electron to version 19 to restore U2F support for AWS Single Sign-On

### [0.15.2](https://github.com/Noovolari/leapp/compare/v0.15.1...v0.15.2) (2022-10-21)

### Features

* added a new tab in the options to manage AWS SSM deafult region behaviour. This feature closes GitHub Issues [#292](https://github.com/Noovolari/leapp/issues/292) and [#232](https://github.com/Noovolari/leapp/issues/232). Thanks to [@akymos](https://github.com/akymos) for the PR!

### Bug Fixes

* fixed AWS IAM Identity Center "Session token not found or invalid" issue [#347](https://github.com/Noovolari/leapp/issues/347)
* increased Leapp Core tests coverage

### [0.15.1](https://github.com/Noovolari/leapp/compare/v0.15.0...v0.15.1) (2022-10-06)

### Bug Fixes

* fixed installing Leapp Plugin from the Plugin Hub not completing properly when the app is not running
* added Leapp Session role name info to CLI start session command [Issue #341](https://github.com/Noovolari/leapp/issues/341) [PR #344](https://github.com/Noovolari/leapp/pull/344). Thanks to [@lordgordon](https://github.com/lordgordon) for reporting the issue and [@andreacavagna01](https://github.com/andreacavagna01) for the PR!

### [0.15.0](https://github.com/Noovolari/leapp/compare/v0.14.3...v0.15.0) (2022-10-03)

### Features

* refactored sessions list introducing recycle of views; in case of many sessions, CPU usage and memory footprint were dramatically reduced. Thanks to [@egauk](https://github.com/egauk) for the [Issue #314](https://github.com/Noovolari/leapp/issues/314)!
* improved startup performance
* now it is possible to create a new Azure Integration directly from Session creation dialog

### [0.14.3](https://github.com/Noovolari/leapp/compare/v0.14.2...v0.14.3) (2022-09-15)

### Features

* added a new set of Leapp Plugin APIs to open the terminal and to work with Leapp sessions (create, edit and clone)
* added a new [Plugin Hub](https://www.leapp.cloud/plugins) to search and install Leapp Plugins directly from the Leapp website

### Bug Fixes

* fixed a problem not allowing Leapp desktop app to start normally on Ubuntu 22.04 LTS [#334](https://github.com/Noovolari/leapp/issues/334)

### [0.14.2](https://github.com/Noovolari/leapp/compare/v0.14.1...v0.14.2) (2022-08-26)

### Features

* added support to Auth0 as SAML IdP. Thanks to [@maintux](https://github.com/maintux) for the [Pull Request #321](https://github.com/Noovolari/leapp/pull/321)!

### Bug Fixes

* fixed constant keychain password prompt on macOS when using Leapp Desktop App/CLI [#317](https://github.com/Noovolari/leapp/issues/317) [#318](https://github.com/Noovolari/leapp/issues/318)
* added a mechanism to backup and restore corrupted Leapp-lock.json files [#282](https://github.com/Noovolari/leapp/issues/282) [#302](https://github.com/Noovolari/leapp/issues/302)
* added an error message with an additional link to download the Session Manager Plugin if the user doesn't have it installed on the computer [#245](https://github.com/Noovolari/leapp/issues/245)
* added an error message with an additional link to troubleshoot problems if the AWS CLI was installed with alternative methods (e.g. Homebrew) [#257](https://github.com/Noovolari/leapp/issues/257)
* fixed minor issues when using the Leapp option menu to download a Leapp plugin from npm

### [0.14.1](https://github.com/Noovolari/leapp/compare/v0.14.0...v0.14.1) (2022-08-18)

### Bug Fixes

* fixed compiler option to allow desktop-app to read base class from plugins

### [0.14.0](https://github.com/Noovolari/leapp/compare/v0.13.4...v0.14.0) (2022-08-18)

### Features

* added new plugin system: users have the ability to download, install, and create custom plugins for Leapp
* added [plugin template](https://github.com/Noovolari/leapp-plugin-template) as a starting point to develop your own plugin

Learn more about Leapp plugins in our in-depth [documentation](https://docs.leapp.cloud/latest/plugins/plugins-introduction/)

### [0.13.4](https://github.com/Noovolari/leapp/compare/v0.13.3...v0.13.4) (2022-08-08)

### Bug Fixes

* fixed dev tools opening on app start

### [0.13.3](https://github.com/Noovolari/leapp/compare/v0.13.2...v0.13.3) (2022-08-08)

### Features

* added feature to copy web-console URL [#296](https://github.com/Noovolari/leapp/issues/296) PR: [#306](https://github.com/Noovolari/leapp/pull/306)

### Bug Fixes

* fixed a bug that entered in CLI interactive mode when running with flags and prevented some commands to work properly [#301](https://github.com/Noovolari/leapp/issues/301) [#259](https://github.com/Noovolari/leapp/issues/259)
* fixed permissions required for running Leapp on Windows. Now it will run with the same permissions as the user using Leapp PR: [#307](https://github.com/Noovolari/leapp/pull/307)

A special **“thank you”** to **Sami Oksanen** ([@c-sami](https://github.com/c-sami)), who made 3 PRs this week!

### [0.13.2](https://github.com/Noovolari/leapp/compare/v0.13.1...v0.13.2) (2022-08-02)

### Bug Fixes
* changed TPS limit introduced in the solution for AWS SSO TooManyRequest error [#281](https://github.com/Noovolari/leapp/issues/281) [#308](https://github.com/Noovolari/leapp/issues/308)

### [0.13.1](https://github.com/Noovolari/leapp/compare/v0.13.0...v0.13.1) (2022-07-14)

### Bug Fixes
* added solution that solves AWS SSO TooManyRequest error [#281](https://github.com/Noovolari/leapp/issues/281) [#297](https://github.com/Noovolari/leapp/pull/297)
* increased Leapp Core tests coverage

Thank you! A huge shout out to the community members who contributed to this release of Leapp!

@peteawood #281 #297

### [0.13.0](https://github.com/Noovolari/leapp/compare/v0.12.2...v0.13.0) (2022-07-12)

### Features

* added support for Azure Integration: now it is possible to sync, start, rotate, edit, stop, and delete all Azure Sessions associated to Azure Tenant Subscriptions
* added support for Brew on Linux: Linux and darwin-x64 rely on npm tarball, while darwin-arm64 rely on a custom installer [#251](https://github.com/Noovolari/leapp/issues/251) [#250](https://github.com/Noovolari/leapp/issues/250)

### Bug Fixes
* fixed tray menu Session list: now it is possible to see more than 10 Leapp Sessions
* automatically strip AWS keys' white spaces [#289](https://github.com/Noovolari/leapp/issues/289)
* added ap-southeast-3 region [#291](https://github.com/Noovolari/leapp/pull/291) [@nitrocode](https://github.com/nitrocode)
* fixed filtering not saving after integration selection

### [0.12.2](https://github.com/Noovolari/leapp/compare/v0.12.1...v0.12.2) (2022-05-30)

### Bug Fixes

* updated Leapp Desktop App's Windows code signing certificate [#277](https://github.com/Noovolari/leapp/issues/277)

### [0.12.1](https://github.com/Noovolari/leapp/compare/v0.12.0...v0.12.1) (2022-05-25)

### Features

* added window options for Desktop App [#280](https://github.com/Noovolari/leapp/pull/280) a special thanks to [@mikedizon](https://github.com/mikedizon)
* added AWS Federated Roles support to us govcloud [#270](https://github.com/Noovolari/leapp/pull/270) a special thanks to [@mikedizon](https://github.com/mikedizon)
* added credentials process and edit session docs

### Bug Fixes

* fixed CTRL+R keybind issue after AWS SSO window closes [#185](https://github.com/Noovolari/leapp/issues/185)
* fixed selected but not applied filters behavior
* dependabot security issues
* fixed docs param typo [#268](https://github.com/Noovolari/leapp/pull/268) [@RafPe](https://github.com/RafPe)
* removed error message shown when AWS SSM plugin is not
* now it is possible to logout from AWS SSO Integrations without deleting sessions [#209](https://github.com/Noovolari/leapp/issues/209)

### [0.12.0](https://github.com/Noovolari/leapp/compare/v0.11.1...v0.12.0) (2022-04-28)

### Features

* ability to edit any type of Session! [#230](https://github.com/Noovolari/leapp/issues/230) [#136](https://github.com/Noovolari/leapp/issues/136) [#42](https://github.com/Noovolari/leapp/issues/42)
* added shortcut to create an [IAM Role Chained Session](https://docs.leapp.cloud/latest/configuring-session/configure-aws-iam-role-chained/) from an IAM User, IAM Role Federated, or AWS SSO Role Session
* added support to credential_process in ~/.aws/config file
* Leapp CLI now [supports scripting using flags](https://docs.leapp.cloud/latest/cli/) for each available command [#259](https://github.com/Noovolari/leapp/issues/259)

### [0.11.1](https://github.com/Noovolari/leapp/compare/v0.11.0...v0.11.1) (2022-04-21)

### Bug Fixes

* fixed v0.11.0 MFA push notification pops up every minute [#248](https://github.com/Noovolari/leapp/issues/248)
* fixed v0.11.0 with okta keeps popping up the logging window every few seconds [#255](https://github.com/Noovolari/leapp/issues/255)

### [0.11.0](https://github.com/Noovolari/leapp/compare/v0.10.0...v0.11.0) (2022-03-31)

### Features

* released [Leapp CLI](https://www.npmjs.com/package/@noovolari/leapp-cli) that extends Leapp Desktop App features ([a45597e](https://github.com/Noovolari/leapp/commit/a45597e13e5db0d89f322dff9829a76939aa2709))
* released [Leapp Core library](https://www.npmjs.com/package/@noovolari/leapp-core) ([a45597e](https://github.com/Noovolari/leapp/commit/a45597e13e5db0d89f322dff9829a76939aa2709))
* added support for M1 arm-based macOS, thanks to [PR #242](https://github.com/Noovolari/leapp/pull/242) by [@nwouda](https://github.com/nwouda)
* you can now report a GitHub issue directly from the Desktop App's tray menu

### Bug Fixes

* clicking outside the session create modal cancels the action [#231](https://github.com/Noovolari/leapp/issues/231)

### [0.10.0](https://github.com/Noovolari/leapp/compare/v0.9.0...v0.10.0) (2022-03-10)

### Features

* [EC2 connect through AWS SSM](https://docs.leapp.cloud/0.10.0/built-in-features/aws-ec2-connect/): added support for iTerm2 on macOS. Thanks to [@jgrumboe](https://github.com/jgrumboe) for the [Pull Request #184](https://github.com/Noovolari/leapp/pull/184)! [#176](https://github.com/Noovolari/leapp/issues/176) [#62](https://github.com/Noovolari/leapp/issues/62)
* now it is possible to open an AWS Web Console from a Leapp Session ([337cff2](https://github.com/Noovolari/leapp/commit/337cff2b81260e7473c6766667d9e78b66f84a24)) [#189](https://github.com/Noovolari/leapp/issues/189) [#13](https://github.com/Noovolari/leapp/issues/13)
* added Dark Theme mode! [#224](https://github.com/Noovolari/leapp/issues/224)
* add support for adfs as a saml identity provider ([#235](https://github.com/Noovolari/leapp/issues/235)) ([17bb29b](https://github.com/Noovolari/leapp/commit/17bb29b040f72d37f83491c5d1e1f6cc708edbab)) [#200](https://github.com/Noovolari/leapp/issues/200)

### Bug Fixes

* fixed retrocompatibility logic that reverted session's profile to default ([dbff233](https://github.com/Noovolari/leapp/commit/dbff233f7a94ad1062fe8f01b60cdabfba6b1d09)) [#202](https://github.com/Noovolari/leapp/issues/202)
* fixed column filtering bug when the values aren't changed ([76b0a2f](https://github.com/Noovolari/leapp/commit/76b0a2fb51710bb6e01a2844a09145fff787f97c)) [#237](https://github.com/Noovolari/leapp/issues/237)
* fixed a misbehavior where all SSM accessible instances were not showing Tag:Name [#232](https://github.com/Noovolari/leapp/issues/232)
* AWS IAM Role Federated login window can now be moved [#191](https://github.com/Noovolari/leapp/issues/191)
* fixed AWS SSO error after session expired [#108](https://github.com/Noovolari/leapp/issues/108)
* check for credential file with correct path for window OS ([a45bd92](https://github.com/Noovolari/leapp/commit/a45bd924a30c3b1b1fa18d61f98a560ef422eff1))
* added logout from federated role sessions, fixed ability to move the login window ([9b9264d](https://github.com/Noovolari/leapp/commit/9b9264dc65b12aeb3d05d2b600d1117b7dcab36c))
* removed the ability to do double chained account in create modal ([64589b4](https://github.com/Noovolari/leapp/commit/64589b45d40618e441d6b14bdc7c43e9ec6ddaf0))

Thank you! A huge shout out to the community members who contributed to this release of Leapp!

### [0.9.0](https://github.com/Noovolari/leapp/compare/v0.8.1...v0.9.0) (2022-02-24)

### Features

* brand new UX/UI! ([7d8e2a9](https://github.com/Noovolari/leapp/commit/7d8e2a949edb6671885715cfb34932e7268c265b))
* new Segment-based Session filtering ([7d8e2a9](https://github.com/Noovolari/leapp/commit/7d8e2a949edb6671885715cfb34932e7268c265b))

### Bug Fixes

* Maintain IAM Role Chained Configurations based on SSO Assumer session ([#209](https://github.com/Noovolari/leapp/issues/209)) ([7d8e2a9](https://github.com/Noovolari/leapp/commit/7d8e2a949edb6671885715cfb34932e7268c265b))
* gpu_init on WSL2 - Leapp_0.8.1_amd64.deb ([#217](https://github.com/Noovolari/leapp/issues/217)) ([7d8e2a9](https://github.com/Noovolari/leapp/commit/7d8e2a949edb6671885715cfb34932e7268c265b))
* AWS Session Expiration Issue ([#220](https://github.com/Noovolari/leapp/issues/220)) ([7d8e2a9](https://github.com/Noovolari/leapp/commit/7d8e2a949edb6671885715cfb34932e7268c265b))
* Enhancement - easier access to commonly used profiles ([#214](https://github.com/Noovolari/leapp/issues/214))
* Add grouping and/or prefix on integration name for session overview ([#203](https://github.com/Noovolari/leapp/issues/203))
* Cancel connecting ([#199](https://github.com/Noovolari/leapp/issues/199))
* The Leapp icon is larger than all other icons in the MacOSX Dock ([#196](https://github.com/Noovolari/leapp/issues/196))
* Add a search option in the SSM session panel ([#87](https://github.com/Noovolari/leapp/issues/87))
* SSO Sync session somewhere on the front page ([#181](https://github.com/Noovolari/leapp/issues/181))
* Make the window resizable ([#43](https://github.com/Noovolari/leapp/issues/43))
* Enhancement - easier access to commonly used profiles ([#214](https://github.com/Noovolari/leapp/issues/214))
* Add grouping and/or prefix on integration name for session overview ([#203](https://github.com/Noovolari/leapp/issues/203))

Thank you! A huge shout out to the community members who contributed to this release of Leapp!

@dnsmichi #215 #216

### [0.8.1](https://github.com/Noovolari/leapp/compare/v0.8.0...v0.8.1) (2022-01-25)

### Features

* added github action for bumping homebrew formula ([cc30a12](https://github.com/Noovolari/leapp/commit/cc30a12c37fbb4ae35a7c3fdbc147c75f8d28a86))

### Bug Fixes

* **LEAP-371:** fixed aws sso sessions synchronization logic ([fc09fce](https://github.com/Noovolari/leapp/commit/fc09fcedc51141c52159bd82a7a47adda870a1f3))
* removed unwanted and unused pages from docs sitemap ([3d3d5b4](https://github.com/Noovolari/leapp/commit/3d3d5b4618910bc0e7049cdd87619b48a55ec417))

### [0.8.0](https://github.com/Noovolari/leapp/compare/v0.7.4...v0.8.0) (2021-11-26)

### Features

* Added support for multiple AWS Single Sign-On through Integrations Menu

### Bug Fixes

* added await statement in front of AwsSsoIntegrationService login saveSecret ([67bdc18](https://github.com/Noovolari/leapp/commit/67bdc185d7e63cd14ac17ac06a8d2e21b5af33be))
* added backslashes for windows path in updater service ([63ec0e5](https://github.com/Noovolari/leapp/commit/63ec0e555f97945af5ca6696012cc7ef722077ac))
* fixed log path ([3c09da8](https://github.com/Noovolari/leapp/commit/3c09da8d4a91c979f49be275b0ea57dda49dac29))
* sso role sessions maintain their region and profiles on sync ([40f023a](https://github.com/Noovolari/leapp/commit/40f023adb950070fe4c52ff4d53a7c272467cc84))
* added check for creating .Leapp .aws directories if missing [#190](https://github.com/Noovolari/leapp/issues/190) ([25e720e](https://github.com/Noovolari/leapp/commit/25e720e3fc4eb4e329cbc604e7fa19ebd8fd7ba5))

### [0.7.4](https://github.com/Noovolari/leapp/compare/v0.7.3...v0.7.4) (2021-11-15)

### Features

* added Sponsorship for Noovolari
* updated electron-rebuild version
* updated Electron and Angular versions, enabling U2F support for AWS Single Sign-On
* implemented AWS SSO browser authentication logic
* implemented AWS SSO OIDC logic for better concurrency management
* add installation instructions for [Homebrew and Linuxbrew](https://docs.leapp.cloud/latest/#macos-homebrew-linux-linuxbrew) (#180) - @deiga

### Bug Fixes

* hiding AWS SSO BrowserWindow when login success is catched (#185)
* added a check if the credential file not exists it creates it
* now all named profiles sections are removed from credentials file upon logout

### [0.7.3](https://github.com/Noovolari/leapp/compare/v0.7.2...v0.7.3) (2021-10-04)

### Bug Fixes

* added aws iam chained role's copy account number ([69b4a09](https://github.com/Noovolari/leapp/commit/69b4a096dec34fea25ff69f525a9673877a8d4bd))
* added secrets deletion in IAM User session's deletion ([9a15039](https://github.com/Noovolari/leapp/commit/9a150390b3ec3ebbe0d76fd0af67aac7f352a70d))

### [0.7.2](https://github.com/Noovolari/leapp/compare/v0.7.1...v0.7.2) (2021-09-29)

### Bug Fixes

* fixed aws ssm start-session on linux systems using gnome-terminal ([b7d9d0b](https://github.com/Noovolari/leapp/commit/b7d9d0b388969538d8958e7f2ed560a6d75c2ce0))

### [0.7.1](https://github.com/Noovolari/leapp/compare/v0.7.0...v0.7.1) (2021-09-23)

### Bug Fixes

* fixed role name not appearing in aws sso's session cards ([13cadc0](https://github.com/Noovolari/leapp/commit/13cadc084b2b5e2de2b03f7039e79eedc11d320a))

### [0.7.0](https://github.com/Noovolari/leapp/compare/v0.6.2...v0.7.0) (2021-09-23)

### Features

* add support for aws azuread federation ([#165](https://github.com/Noovolari/leapp/issues/165)) ([2d0b70b](https://github.com/Noovolari/leapp/commit/2d0b70b5f935ad0b5abac72ee73cf6bcfdba0cef)), closes [#160](https://github.com/Noovolari/leapp/issues/160)
* add tooltip to show session & detail info ([#169](https://github.com/Noovolari/leapp/issues/169)) ([14b5b7c](https://github.com/Noovolari/leapp/commit/14b5b7c3d3cf418a3a81534de03f336771908381))

### Bug Fixes

* [#171](https://github.com/Noovolari/leapp/issues/171) back button now returns to list if there are already some sessions otherwise it will return to start of provider selection ([06c6a10](https://github.com/Noovolari/leapp/commit/06c6a106b7875b68eaa41ef227759a1fb856b7b5))
* [#172](https://github.com/Noovolari/leapp/issues/172) IAM user account number is retrieved using GetCallerIdentity() ([e0c6d4c](https://github.com/Noovolari/leapp/commit/e0c6d4c8736544f4e4be92e09fc92e0c73f93c56))
* [#157](https://github.com/Noovolari/leapp/issues/157) 2020 is over and added version to sidebar ([714dd91](https://github.com/Noovolari/leapp/commit/714dd91890a31a15b8352a5d5721ae8ec337ff84))
* [#167](https://github.com/Noovolari/leapp/issues/167) typo in button ([ffc75a6](https://github.com/Noovolari/leapp/commit/ffc75a6a3f8ce3a0a6b4d1e6723da815eac97fe7))

Thank you!
A huge shout out to the community members who contributed to this release of Leapp!

[@mholttech](https://github.com/mholttech) #169 #165

[@Plasma](https://github.com/Plasma) #167

[@jgrumboe](https://github.com/jgrumboe) #157

### [0.6.2](https://github.com/Noovolari/leapp/compare/v0.6.1...v0.6.2) (2021-08-05)


### Features

* allow defining iam role session name ([#155](https://github.com/Noovolari/leapp/issues/155)) ([9e21ef2](https://github.com/Noovolari/leapp/commit/9e21ef2749cca9b9dcbee05c95612487dd65c56a))


### Bug Fixes

* aws iam user access keys are now stored sequentially ([b64041e](https://github.com/Noovolari/leapp/commit/b64041ed29b906656ac88e153c9e8980ebc4e83c)), closes [#154](https://github.com/Noovolari/leapp/issues/154)
* fallback to assumed-from-leapp in case of AwsIamRoleChainedSession without roleSessionName ([09293b6](https://github.com/Noovolari/leapp/commit/09293b6fad13ef464571ed598d3ad71653b90fca))
* ignoring net::ERR_CONNECTION_REFUSED in AWS SSO verification browser window ([e281746](https://github.com/Noovolari/leapp/commit/e28174692ccf3f11ed250f1b23f0bdbeb2fe6d02)), closes [#152](https://github.com/Noovolari/leapp/issues/152)

### [0.6.1](https://github.com/Noovolari/leapp/compare/v0.6.0...v0.6.1) (2021-07-14)


### Features

* added CodeQL analysis GitHub ([9d57ae4](https://github.com/Noovolari/leapp/commit/9d57ae4ca7f489a1cd979ac01b72abb3a25534a5))
* added GitHub action for building docs ([ac4a919](https://github.com/Noovolari/leapp/commit/ac4a919fed54dcb43b02ff3f1307fa285407076a))
* ported docs to mkdocs ([dd28173](https://github.com/Noovolari/leapp/commit/dd28173f67b11d4cbb32f3f81e120a64db7c593f))


### Bug Fixes

* [#133](https://github.com/Noovolari/leapp/issues/133) ([b45633e](https://github.com/Noovolari/leapp/commit/b45633e073b7a333b58c3f103a0515eed443dd59))
* [#138](https://github.com/Noovolari/leapp/issues/138) ([d461737](https://github.com/Noovolari/leapp/commit/d46173796ad56619226160a18ec11ee0783eabb9)), closes [#113](https://github.com/Noovolari/leapp/issues/113)
* added icons for both light and dark themes ([9bc35c9](https://github.com/Noovolari/leapp/commit/9bc35c938a3d27ebdf219ca5dfbeb715322d87a8))
* added sessionServiceProvider to tray component stop ([975ff5b](https://github.com/Noovolari/leapp/commit/975ff5be7868952c4732c6e2d50de2b7ddd16d48))
* closing MFA dialog without inserting code; put session inactive and show a warning to user ([0d2ae22](https://github.com/Noovolari/leapp/commit/0d2ae22eb1edbdbbebd8896655b7d4660416609f))
* fixed log file path ([aea3b52](https://github.com/Noovolari/leapp/commit/aea3b526ea412014b07353dfd7d9a8905f63bba5))

### [0.6.0](https://github.com/Noovolari/leapp/compare/v0.5.3...v0.6.0) (2021-06-30)

### Features

* added AWS Named-Profile support ([#117](https://github.com/Noovolari/leapp/issues/117))
* added support for AWS System Manager Session Manager Session for not active Session. Now AWS Credentials are injected in the Terminal window.
* added [specifications](https://github.com/Noovolari/leapp/wiki/Specs) and [new project structure](https://github.com/Noovolari/leapp/wiki/project-structure)
* added [Jasmine Test Suite](https://jasmine.github.io/), and Automatic testing for the core Services of Leapp.

### Bug Fixes

* creating workspace if not existining in AWS SSO service ([09bea27](https://github.com/Noovolari/leapp/commit/09bea2762717d9446033e5e932fdb3090b50065c))
* fixed idpurls in retrocompatibility.service.ts ([74c1959](https://github.com/Noovolari/leapp/commit/74c19594c87103d00866ea2b54a72f3f01ca873c))

### [0.5.3](https://github.com/Noovolari/leapp/compare/v0.5.2...v0.5.3) (2021-05-11)


### Features

* updater system has been completely rewritten from scratch with the ability to manually install a new update without letting Leapp install it on your behalf. If someone prefers to stick to a specific version, it can be done, by using the "remind me later" button, which mute update notifications until the next release. ([8e755e1](https://github.com/Noovolari/leapp/commit/8e755e10a3e037370b733e1b2a90bd8c8e8c7e94))

### [0.5.2](https://github.com/Noovolari/leapp/compare/v0.5.7...v0.5.2) (2021-06-15)


### Bug Fixes

* fixed idpurls in retrocompatibility.service.ts ([74c1959](https://github.com/Noovolari/leapp/commit/74c19594c87103d00866ea2b54a72f3f01ca873c))

### [0.5.1](https://github.com/Noovolari/leapp/compare/v0.5.7...v0.5.1) (2021-06-15)


### Bug Fixes

* fixed idpurls in retrocompatibility.service.ts ([74c1959](https://github.com/Noovolari/leapp/commit/74c19594c87103d00866ea2b54a72f3f01ca873c))
