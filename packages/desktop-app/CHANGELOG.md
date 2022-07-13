### [0.13.0](https://github.com/Noovolari/leapp/compare/v0.12.2...v0.13.0) (2022-07-12)

### Features

* added support for Azure Integration: now it is possible to sync, start, rotate, edit, stop, and delete all Azure Sessions associated to Azure Tenant Subscriptions
* added support for Brew on Linux: Linux and darwin-x64 rely on npm tarball, while darwin-arm64 rely on a custom installer [#251](https://github.com/Noovolari/leapp/issues/251) [#250](https://github.com/Noovolari/leapp/issues/250)

### Bug Fixes
* fixed tray menu Session list: now it is possible to see more than 10 Leapp Sessions
* automatically strip AWS keys' white spaces [#289](https://github.com/Noovolari/leapp/issues/289)
* added ap-southeast-3 region [#291](https://github.com/Noovolari/leapp/pull/291) [@nitrocode](https://github.com/nitrocode)
* fixed filtering not saving after integration selection
