# AWS IAM User



Leapp automatically uses your **Access Key ID** and **Secret Access Key** for generating temporary credentials through the [AWS STS Get Session Token](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html).

> Access and secret keys are safely stored in the system vault. Please head to [vault strategy](https://www.github.com/Noovolari/leapp/wiki/vault-strategy) section if you want to know how Leapp manages your secrets.

![type:video](../videos/User.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

*Note: it's possible to assign an MFA device to a plain session. Please see [MFA section](https://github.com/Noovolari/leapp/wiki/mfa) for more details.*

### Caveats

Generating credentials from AWS STS Get Session Token results in some limits to the actions that the resulting temporary credentials can perform.

> Cannot call IAM API operations unless MFA information is included with the request.

> Cannot call AWS STS API operations except AssumeRole or GetCallerIdentity.

> SSO to console is not allowed.
