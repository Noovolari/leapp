Leapp
=========
[![Github All Releases](https://img.shields.io/github/downloads/noovolari/leapp/latest/total)](https://github.com/Noovolari/leapp/releases/latest)
[![Discord Badge](https://img.shields.io/discord/745629705964617820)](https://discord.gg/wHh2kyK)
- Website: https://www.leapp.cloud/
- Roadmap: [Roadmap](https://github.com/Noovolari/leapp/projects/1)
- Wiki: [Wiki](https://github.com/Noovolari/leapp/wiki)
- Chat with us: [Discord](https://discord.gg/wHh2kyK)

![logo](.github/images/README-1.png)

Leapp is a DevTool Desktop App designed to **manage and secure Cloud Access in multi-account environments.**

The App is designed to work with Cloud Providers APIs, CLIs, and SDKs.

It's a tool that securely [**stores your access information in a secure place**](https://github.com/Noovolari/leapp/wiki/vault-strategy) and generates temporary credential sets to access your Cloud from your local machine.

> We Strongly believe that access information to Cloud in `~/.aws` or `~/.azure` files are not safe, and **[we prefer to store that information in an encrypted file managed by the system.](https://github.com/Noovolari/leapp/wiki/vault-strategy)**
> Credentials will be hourly rotated and accessible in those files only when they are needed, so only when Leapp is active.

![Leapp App](.github/images/Leapp-Keynote-pitch.001.png)
# Table of Contents

- [Key features](#key-features)
- [Installation](#installation)
- [Use Cases](#use-cases)
  * [AWS Plain Access](#aws-plain-access)
  * [AWS Federated Access](#aws-federated-access)
  * [AWS Single Sign-On](#aws-single-sign-on)
  * [AWS Truster Access](#aws-truster-access)
  * [Azure Access](#azure-access)
- [Supported Providers](#supported-providers)
  * [Cloud Providers](#cloud-providers)
  * [Identity Providers](#identity-providers)
- [Documentation](#documentation)  
- [Logs](#logs)
- [Links](#links)
- [License](#license)


# Key features
- ### Switch **Cloud Profile** in a click
  No need to manage the credentials file. Get connected to your accounts in a click. 
- ### Secure repository for your access data
  [Protect your cloud accounts access data in the system vault](https://github.com/Noovolari/leapp/wiki/vault-strategy) and connect straight away.
- ### Multiple cloud access strategies
  Connect with [federated single sign-on](#supported-providers), roles or static credentials.
- ### No static credentials
  Generate and inject only [temporary credentials to comply with security best-practices.](https://github.com/Noovolari/leapp/wiki/rotating-credentials)
- ### Generate and use sessions directly from your AWS Organizations
  Access to multiple AWS accounts with [AWS single sign-on](https://aws.amazon.com/single-sign-on/) access.
- ### Connect EC2 instances straight away
  Connect to your EC2 Instances with AWS System Manager.


![Leapp App animation](.github/images/Leapp-animation.gif)


# Installation
Get [here](https://github.com/Noovolari/leapp/releases/latest) the latest release.

# Use Cases
Our use cases are hereby presented to give you a hint on how Leapp can be of help to depend on the type of setup 
you have in your company and what kind of credentials you need to get.

## AWS Plain Access
Store AWS IAM User's Access Keys in your System Vault through Leapp. 
Leapp automatically manages **Access Key ID** and **Secret Access Key** in your AWS credentials, 
generating temporary credentials for them.

**No credentials** are stored in Leapp. 

Please see [Vault strategy](https://www.github.com/Noovolari/leapp/wiki/vault-strategy) for more information.

![Plain Access Use-case](.github/images/plain-gif.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

*Note: it's possible to assign an MFA device to a plain session. Please see [MFA section](https://github.com/Noovolari/leapp/wiki/mfa) for more details.*

## AWS Federated Access
Federation is established between **G Suite** and **AWS**. No more AWS credentials 
management is needed. Leapp allows you to get to cloud resources with company email and password.

![Federated Access Use-case](.github/images/federated-gif.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

## AWS Single Sign-On
Access to your AWS Accounts through Leapp and let the App manage all the available session to generate Temporary Access and Secret keys.
![AWS SSO video](.github/images/AWS_SSO.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

## AWS Truster Access
Access to an Aws Account Role via another AWS Account role or an IAM user, thanks to a cross-account role available via [STS](https://docs.aws.amazon.com/STS/latest/APIReference/welcome.html).
In this access strategy a **Truster Role** or a **Plain User** is assumed by a **federated role**.

![Truster Access Use-case](.github/images/truster-gif.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

*Note: it's possible to apply MFA to a truster session by setting it on the plain account it relies on. Please see [MFA section](https://github.com/Noovolari/leapp/wiki/mfa) for more details.*

## Azure Access
Use Leapp to do Single Sign On with G Suite on Azure to get access to your 
**Subscriptions**. In this use case is **mandatory** to have defined a Federation 
between Google and Azure. Leapp manage the login process for you to have Azure CLI 
ready to be used.

![Azure Access Use-case](.github/images/azure-gif.gif)

See setup [tutorial](https://www.github.com/Noovolari/leapp/wiki/tutorials)

# Supported Providers
## Cloud Providers
- **AWS** - :white_check_mark:
- **AZURE** - :white_check_mark:
- **GCP** - :soon:
## Identity Providers
- **G Suite to AWS** - :white_check_mark:
- **G Suite to Azure** - :white_check_mark:
- **AZURE AD to Azure** - :white_check_mark:
- **AZURE AD to AWS** - :soon:
- **AWS Single Sign-On** - :white_check_mark:

# Logs
By default, Leapp writes logs to the following locations:

- on Linux: `~/.config/Leapp/logs/log.log`
- on macOS: `~/Library/Logs/Leapp/log.log`
- on Windows: `%USERPROFILE%\\AppData\\Roaming\\Leapp\\log.log`
Logs are structured in the following way:
```
[YYYY-MM-DD HH:mm:ss.mmm] [LEVEL] [rendered/system] [COMPONENT] MESSAGE {Useful Object / Stacktrace Err Object}
```
*Note: please always add logs whenever possible to any issue you want to fill to enable the team identify the problem quickly*

## Documentation
Here you can find our [documentation](https://github.com/Noovolari/leapp/wiki).

## Links
- [Glossary](.github/GLOSSARY.md): find other information about the system
- [Roadmap](https://github.com/Noovolari/leapp/projects/1): view our next steps and stay up to date
- [Contributing](./.github/CONTRIBUTING.md): follow the guidelines if you'd like to contribute to the project
- [Project Structure](./.github/PROJECT_STRUCTURE.md): check how we structured the project and where to find the files
## License
[Mozilla Public License v2.0](https://github.com/Noovolari/leapp/blob/master/LICENSE)
