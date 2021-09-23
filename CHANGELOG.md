# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.7.1](https://github.com/Noovolari/leapp/compare/v0.7.0...v0.7.1) (2021-09-23)


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
