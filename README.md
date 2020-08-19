Leapp
=========

- Website: https://www.leapp.cloud/
- Roadmap: [Roadmap](https://github.com/Noovolari/leapp/projects/1)
- Tutorials: [Tutorials](#tutorials)

![logo](.github/images/README-1.png)

Leapp is your everyday companion to access your cloud; designed to work with multiple Identity Providers and Cloud Providers APIs, CLIs, and SDKs.
It's a software that securely stores your access information and generates temporary credential sets to access your cloud ecosystem from your local machine.

For example, while using the AWS CLI it may become annoying to switch to a different profile or use the --profile argument before issuing every command. Leapp lets you have a new set of credentials and give access to that account with a click.

# Key features

- **Federated Single Sign-On to your multi-cloud environment:** inside Leapp, you can configure the SAML SSO URL against which you can authenticate with your IdP-hosted identity, and retrieve the SAML assertion that allows federated access to your Service Provider.
- **Credentials management:** Leapp relieves you from generating, rotating, and deleting credentials retrieved from the Service Provider to access your Cloud Resources. In case the Service Provider is AWS, credentials are generated invoking the assume-role API, that requires the SAML Assertion to be provided in the payload. Generated credentials will be rotated periodically. Once you stop the current session, credentials will be deleted for security purposes. In case the Service Provider is AWS, the credentials file will be deleted. That file will be recreated once you start a new session.
- **Access configuration:** you can set up access to a Federated Account or to a Truster Account. A Federated Account is one that contains information about the IdP, while the Truster Account is the one that you can access from the Federated Account. You can configure an Access Quick List, that allows you to generate a new set of credentials in a click.

# What is supported?

## Cloud Providers
- **AWS** - :white_check_mark:
- **AZURE** - :cyclone:
- **GCP** - :cyclone:

## Identity Providers
- **G Suite** - :white_check_mark:
- **AZURE AD** - :cyclone:
- **AWS SSO** - :cyclone:

Follow the [roadmap](https://github.com/Noovolari/leapp/projects/1) to stay up to date.


# Installation

Get [here](https://github.com/Noovolari/leapp/releases/latest) the latest release.

To install the compiled version, choose the one for your **OS** and simply **double-click** on the executable.

# Quickstart

Leapp is a desktop application build in [Electron](https://www.electronjs.org/) + [Angular 8](https://angular.io/) that manage and rotate your credentials while keeping them secure by encrypting all the information and removing the credential file and closing the session when the program is closed.

# Tutorials

Here is a list of curated **tutorials** to **help you getting started**.

## Pre-requisites

- Federation between G Suite and AWS
    - [G Suite Federation Setup](.github/tutorials/G_SUITE_FEDERATION_SETUP.md)
    - [AWS Federation Setup](.github/tutorials/AWS_FEDERATION_SETUP.md)
- [Enable role federated access](.github/tutorials/ENABLE_ROLE_FEDERATED_ACCESS.md)
- [Assign role to G Suite Principal](.github/tutorials/ASSIGN_ROLE_TO_G_SUITE_PRINCIPAL.md)

## Leapp usage

- [Configure your SAML Application SSO URL](.github/tutorials/CONFIGURE_YOUR_SAML_APPLICATION_SSO_URL.md)
- [Manage Federated Accounts and Federated Roles](.github/tutorials/MANAGE_FEDERATED_ACCOUNTS_AND_FEDERATED_ROLES.md)
- [Manage Truster Accounts and Truster Roles](.github/tutorials/MANAGE_TRUSTER_ACCOUNTS_AND_TRUSTER_ROLES.md)
- [Manage Quick List](.github/tutorials/MANAGE_QUICK_LIST.md)

# Glossary

Here's the link to the glossary where you can find other information about the system.

- [Glossary](.github/GLOSSARY.md)

# Contributing

If you'd like to contribute to our project, please follow the guidelines proposed in our **contributing** document.

- [CONTRIBUTING.md](./.github/CONTRIBUTING.md)

# Project Structure

To learn how we structured the project and where to check for contributing refer to **project structure* document.

- [PROJECT_STRUCTURE.md](./.github/PROJECT_STRUCTURE.md)

# License

You can find our license here

- [LICENSE](LICENSE) (mpl-2)
