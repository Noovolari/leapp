# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
