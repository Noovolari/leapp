# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.4](https://github.com/Noovolari/leapp/compare/v0.7.1...v0.7.4) (2021-11-15)


### Features

* add support for aws azuread federation ([#165](https://github.com/Noovolari/leapp/issues/165)) ([bc7f694](https://github.com/Noovolari/leapp/commit/bc7f6946c9fc607689086d13dcf5a7f0606556cc)), closes [#160](https://github.com/Noovolari/leapp/issues/160)
* add tooltip to show session & detail info ([#169](https://github.com/Noovolari/leapp/issues/169)) ([9e27d4f](https://github.com/Noovolari/leapp/commit/9e27d4fce738442c4b4b4af3a46b426993987655))
* added codeql analysis github ([0036e00](https://github.com/Noovolari/leapp/commit/0036e00d6548725e0f1f0ba1fcf8bdc1abbeb56b))
* added github action for building docs ([6ea77fa](https://github.com/Noovolari/leapp/commit/6ea77fa93fbe69fc1c923f7cff1d7bebe0f9d229))
* allow defining iam role session name ([#155](https://github.com/Noovolari/leapp/issues/155)) ([ac6e08f](https://github.com/Noovolari/leapp/commit/ac6e08f71252eaa9313045771f51fab057ac49b8))
* open AWS SSO login in default browser ([475484c](https://github.com/Noovolari/leapp/commit/475484c0547650d08abf63f800a9502b22718e61))
* ported docs to mkdocs ([e87326f](https://github.com/Noovolari/leapp/commit/e87326f2147c890786af242b3b0621dcb12e022c))
* updater system has been completely rewritten from scratch with the ability to manually install a new update without letting Leapp install it on your behalf. If someone prefers to stick to a specific version, it can be done, by using the "remind me later" button, which mute update notifications until the next release. ([6046e71](https://github.com/Noovolari/leapp/commit/6046e71eca3b07225aa0ad190b47c7a461f6c937))


### Bug Fixes

* [#133](https://github.com/Noovolari/leapp/issues/133) ([ad12a32](https://github.com/Noovolari/leapp/commit/ad12a3240a60baf473d6feec0578180c7c12844d))
* [#138](https://github.com/Noovolari/leapp/issues/138) ([751398d](https://github.com/Noovolari/leapp/commit/751398d322ff69944041c7c0e3584f9b4c776f23)), closes [#113](https://github.com/Noovolari/leapp/issues/113)
* [#171](https://github.com/Noovolari/leapp/issues/171) back button now returns to list if there are already some sessions otherwise it will return to start of provider selection ([103bf47](https://github.com/Noovolari/leapp/commit/103bf476ec85306e3ca399938952a88a83e903de))
* [#172](https://github.com/Noovolari/leapp/issues/172) IAM user account number is retrieved using GetCallerIdentity() ([163efcc](https://github.com/Noovolari/leapp/commit/163efccf2bf5abd8a820d452a960f5915e17c55a))
* **#89:** Error on Copy Account Number ([23787f0](https://github.com/Noovolari/leapp/commit/23787f047e3e0bebb8eb4a03f1092a74b261d96b)), closes [#89](https://github.com/Noovolari/leapp/issues/89)
* added a fix for ssm on ubuntu systems ([b0fcf8b](https://github.com/Noovolari/leapp/commit/b0fcf8b36868a13bb3fef2d2b84b44f203a593f7))
* added aws iam chained role's copy account number ([69b4a09](https://github.com/Noovolari/leapp/commit/69b4a096dec34fea25ff69f525a9673877a8d4bd))
* added icons for both light and dark themes ([df76d6d](https://github.com/Noovolari/leapp/commit/df76d6dec47b87b68bc5dc5671b2a0ef36539e2c))
* added secrets deletion in IAM User session's deletion ([9a15039](https://github.com/Noovolari/leapp/commit/9a150390b3ec3ebbe0d76fd0af67aac7f352a70d))
* added sessionServiceProvider to tray component stop ([2e33c17](https://github.com/Noovolari/leapp/commit/2e33c1751a2e0aa8377c42825aaa9cdfcfec8bda))
* aws iam user access keys are now stored sequentially ([9975d80](https://github.com/Noovolari/leapp/commit/9975d80929f026ed821ef8ebb466344b5b5dfd7b)), closes [#154](https://github.com/Noovolari/leapp/issues/154)
* back button always visible during session creation steps ([9846c78](https://github.com/Noovolari/leapp/commit/9846c78f4b6fc0636a93a7a1cf06adbc80d337f5)), closes [#103](https://github.com/Noovolari/leapp/issues/103)
* changed aws-sso.component login condition ([b31532a](https://github.com/Noovolari/leapp/commit/b31532a28c936195bad9d179515c6a415c6a23c5))
* changed startSession to stopSession when changing default region to require refresh credentials and see updated values ([99c48c9](https://github.com/Noovolari/leapp/commit/99c48c97ed06ba55e23810ce44bf12864534feb2))
* **chore:** 2020 is over and added version to sidebar ([#157](https://github.com/Noovolari/leapp/issues/157)) ([ad36840](https://github.com/Noovolari/leapp/commit/ad36840bb360095158468992ef238225d6fa4d30))
* closing MFA dialog without inserting code put session inactive and show a warning to user ([34bcadc](https://github.com/Noovolari/leapp/commit/34bcadcf0f76d5a7eb736685e9798d066f174d4e))
* corrected session timeout for AWS Single Sign-On session ([e2054d1](https://github.com/Noovolari/leapp/commit/e2054d115338fdf3d096ad71cbb0effb442ca8ed)), closes [#108](https://github.com/Noovolari/leapp/issues/108) [#105](https://github.com/Noovolari/leapp/issues/105)
* creating workspace if not existining in AWS SSO service ([81d4539](https://github.com/Noovolari/leapp/commit/81d4539265d21613deba563257d43ebcdba846db))
* fallback to assumed-from-leapp in case of AwsIamRoleChainedSession without roleSessionName ([85e2707](https://github.com/Noovolari/leapp/commit/85e2707433cb87567113d7f8c7c0971d33de8582))
* fixed aws ssm start-session on linux systems using gnome-terminal ([abfbeeb](https://github.com/Noovolari/leapp/commit/abfbeebfedee70dde311df8d10f2136e0a9355a6))
* fixed consistency of idpUrls among all idpUrls .filter ([9d4aec9](https://github.com/Noovolari/leapp/commit/9d4aec964fd2cfd01d3df5bfced3186312f9aa3b))
* fixed default profile creation after first account creation; implemented session token invalidation ([1a13351](https://github.com/Noovolari/leapp/commit/1a1335173f1c36c7c297b81250b52736e16a082f))
* fixed idpurls in retrocompatibility.service.ts ([14b1b38](https://github.com/Noovolari/leapp/commit/14b1b381e27af85d134f2bee1e432a5f37c1a1fc))
* fixed log file path ([7f7b1a1](https://github.com/Noovolari/leapp/commit/7f7b1a18e44fd81f873455e27787be2ae7d758e2))
* fixed role name not appearing in aws sso's session cards ([428daa2](https://github.com/Noovolari/leapp/commit/428daa2b499d0265f291b785105b7922a9501655))
* hiding AWS SSO BrowserWindow when login success is catched ([f467338](https://github.com/Noovolari/leapp/commit/f46733878aa72c07ca04984584d5cc803a3c5c54)), closes [#185](https://github.com/Noovolari/leapp/issues/185)
* icons in tray menu now reflect status of home page, user icon now is same gray as other icons ([3e375f9](https://github.com/Noovolari/leapp/commit/3e375f9801a7ecf2220b31757ac90c638bae4ccc))
* ignoring net::ERR_CONNECTION_REFUSED in AWS SSO verification browser window ([4c89ae0](https://github.com/Noovolari/leapp/commit/4c89ae09f67463d00de61f442f06b67a2c059c65)), closes [#152](https://github.com/Noovolari/leapp/issues/152)
* implemented workspace's idpUrls and profiles sanitize method; it's used in app.component's and session.component's ngOnInit method ([7afa535](https://github.com/Noovolari/leapp/commit/7afa53577793899d996b181fb5d4ab7e9fc071e9))
* **LEAP-256:** aws single sign-on set in-app login as default one ([a262977](https://github.com/Noovolari/leapp/commit/a262977b0f504bfbdb0c43d73255b2712073a200))
* leap-258, browser not opening when clicking over link in loading page ([844f5ef](https://github.com/Noovolari/leapp/commit/844f5ef6a939699fbce0c9aaadd97db7ae5e4025))
* **LEAP-259:** invoking unsetOidc on closing AWS SSO Browser Window, to reset the client ([d339f0b](https://github.com/Noovolari/leapp/commit/d339f0bf88b3717f5d9ae3748aae2c492742c802))
* **LEAP-261:** now all named profiles sections are removed from credentials file upon logout ([a955909](https://github.com/Noovolari/leapp/commit/a9559098a1ebbafa2247ee1cc3a7e53a6a1c19ca))
* **LEAP-262:** now, when AWS SSO login main flow goes in timeout, loginMutex is reset ([e593f1f](https://github.com/Noovolari/leapp/commit/e593f1f4544f45728870a9d4f8ede8ee16198115))
* leap-263, back button always return to home ([588185e](https://github.com/Noovolari/leapp/commit/588185ec0262ecd9471b3b9f61cd9de1a733b974))
* now change region and change profile actions are visible only if the session is not active ([c89c9cd](https://github.com/Noovolari/leapp/commit/c89c9cd715026d3113c331f8eaa0ea010fa7660b))
* now you can safely copy account number and role ARN from session list ([c8231d2](https://github.com/Noovolari/leapp/commit/c8231d2fdaceb4c4238711297ee4302d51eb8641)), closes [#89](https://github.com/Noovolari/leapp/issues/89)
* re-enabled change region and profile when session is active; when region or profile is changed, every active session credentials are refreshed ([c0b46eb](https://github.com/Noovolari/leapp/commit/c0b46ebdbd2fc12ec0b7367b8eff5352806b1fef))
* removed unsubscription and added last function to the pipe of refreshing credentials.service.ts ([73ebb9c](https://github.com/Noovolari/leapp/commit/73ebb9c0fec39ef92bfaa0f1e701f5ec6dd253c7))
* search bar filter now persists between list refreshes ([a6e6edd](https://github.com/Noovolari/leapp/commit/a6e6eddbf800ca172fc32d23ccffaa69d3566d1c)), closes [#101](https://github.com/Noovolari/leapp/issues/101)
* solved condition bug in isThereAnotherPendingSessionWithSameNamedProfile method ([16fe797](https://github.com/Noovolari/leapp/commit/16fe797976a17adaad86d03416de8279066ac39a))
* supporting referrals as AWS Single sign-On URL ([089d891](https://github.com/Noovolari/leapp/commit/089d891c844a6ad19e1df165a8b109fa4816418e)), closes [#95](https://github.com/Noovolari/leapp/issues/95)
* truster can be created from plain with a clean configuration ([98b9258](https://github.com/Noovolari/leapp/commit/98b925808604d36b295e285c48c8bfebc08ee3be)), closes [#116](https://github.com/Noovolari/leapp/issues/116)
* typo in button ([#167](https://github.com/Noovolari/leapp/issues/167)) ([e6eef33](https://github.com/Noovolari/leapp/commit/e6eef33006448789b133c50f869236b9fc7226fc))
* when changing session's profile, named profile in credentials ini file will be modified only if the session is active ([396c508](https://github.com/Noovolari/leapp/commit/396c508b749428416b9a35fc290bdbfaa7463a9a)), closes [#110](https://github.com/Noovolari/leapp/issues/110) [#109](https://github.com/Noovolari/leapp/issues/109) [#107](https://github.com/Noovolari/leapp/issues/107)
* working on correcting double jump for truster by removing references to profile as we don't need it for internal operations, wepass directly the sts generated credentials to all internal methods ([ef8176d](https://github.com/Noovolari/leapp/commit/ef8176d1b34423310363e585b0fa929489e42d90))

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
