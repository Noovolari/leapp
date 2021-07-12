# AWS IAM Roles

## AWS IAM Federated Role
Federation is established between **G Suite**, **Okta**, **OneLogin** and **AWS**. No more AWS credentials
management is needed.

Leapp allows you to get to cloud resources with company email and password.

![Federated Access Use-case](../videos/Federated.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

## AWS IAM Chained Role
Access to an Aws Account Role via another AWS Account role or an IAM user, thanks to a cross-account role available via [STS](https://docs.aws.amazon.com/STS/latest/APIReference/welcome.html).

In this access strategy a **Truster Role** or a **Plain User** is assumed by a **federated role**.

![Truster Access Use-case](../videos/Chained.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

*Note: it's possible to apply MFA to a truster session by setting it on the plain account it relies on. Please see [MFA section](https://github.com/Noovolari/leapp/wiki/mfa) for more details.*
