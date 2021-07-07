# AWS IAM User

Store AWS IAM User's Access Keys in your System Vault through Leapp.

Leapp automatically manages **Access Key ID** and **Secret Access Key** in your AWS credentials, generating temporary credentials through the [AWS STS Get Session Token](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html).

> Access and secret keys are stored in the system vault

Please see [Vault strategy](https://www.github.com/Noovolari/leapp/wiki/vault-strategy) for more information.

![Plain Access Use-case](https://github.com/Noovolari/leapp/wiki/images/plain-gif.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

*Note: it's possible to assign an MFA device to a plain session. Please see [MFA section](https://github.com/Noovolari/leapp/wiki/mfa) for more details.*

### Caveats

Generating credentials from AWS STS Get Session Token results in some limits to the actions that the resulting temporary credentials can perform.

> Cannot call IAM API operations unless MFA information is included with the request.

> Cannot call AWS STS API operations except AssumeRole or GetCallerIdentity.

> SSO to console is not allowed.
