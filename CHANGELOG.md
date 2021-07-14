# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
