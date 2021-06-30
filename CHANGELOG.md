# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines. 

App downloads are available in the [website](https://www.leapp.cloud/releases.html)

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
