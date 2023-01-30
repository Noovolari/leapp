---
title: "Configure AWS IAM Role Federated"
description: "How to configure an AWS IAM Role Federated session. An AWS IAM Role Federated session represents an access type that relies on a federation between an AWS account and an external Identity Provider."
pageType: "session"
structuredData:
    howTo:
        title: "Configure AWS IAM Role Federated"
        tip1: "From the top bar, click on the plus icon to ass a new session."
        tip2: "Select "Amazon AWS" as the Cloud Provider."
        tip3: "Select "AWS IAM Role Federated" as the access method."
        tip4: "Provide the required information (described in the next section)."
        tip5: "Click on the "Create Session" button."
social:
    title: "Configure AWS IAM Role Federated"
    description: "How to configure an AWS IAM Role Federated session. An AWS IAM Role Federated session represents an access type that relies on a federation between an AWS account and an external Identity Provider."
    relativeImagePath: "aws-iam-role-federated-session.png"
sitemap:
    video:
        title: "Configure AWS IAM Role Federated"
        content: "newuxui/aws-iam-federated.mp4"
---

## What is an AWS IAM Role Federated session

An AWS IAM Role Federated session represents an access type that relies on a federation between an AWS account and an external Identity Provider.  

AWS Identity and Access Management (IAM) supports identity federation for delegated access to the AWS Management Console or AWS APIs. 
With identity federation, external identities are granted secure access to resources in your AWS accounts through IAM roles.

These external identities can come from your corporate identity provider (such as Microsoft Active Directory or from the AWS Directory Service) 
or from a web identity provider (such as Amazon Cognito, Login with Amazon, Facebook, Google, or any OpenID Connect-compatible provider).

We currently only support SAML 2.0 federation.

!!! Info
    - Refer to [this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_saml.html) to provision your own federated roles.
    - Refer to [this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_saml.html) to configure and trust your SAML 2.0 Identity Provider.

### Supported SAML Identity Providers

| Identity Provider          | AWS                                  | Azure                               |
| -------------------------- | ------------------------------------ | ------------------------------------|
| `GSUITE`                   | :white_check_mark:                   | :x:                                 |
| `OKTA`                     | :white_check_mark:                   | :x:                                 |
| `ONELOGIN`                 | :white_check_mark:                   | :x:                                 |
| `AZURE AD`                 | :white_check_mark:                   | :white_check_mark:                  |
| `AUTH0`                    | :white_check_mark:                   | :x:                                 |

## How to configure an AWS IAM Role Federated in Leapp

1. From the top bar, click on the plus icon to ass a new session.
2. Select "Amazon AWS" as the Cloud Provider.
3. Select "AWS IAM Role Federated" as the access method.
4. Provide the required information (described in the next section).
5. Click on the "Create Session" button.

## Required information

| Field                      | Description                                                                                                              |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `SESSION ALIAS`            | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to find inside Leapp.       |
| `NAMED PROFILE`            | Your friendly session name in the AWS credential file. You will be able to reference it from the AWS CLI with `--name`. |
| `REGION`                   | Your default region of choice. Select the one which you use the most for this Session.                                   |
| `SAML 2.0 URL`             | Your SAML URL interface to start the authentication flow and log into your Identity provider.                               |
| `AWS IDENTIY PROVIDER ARN` | Your Identity Provider ID in AWS. You can find it in IAM section Identity Providers.                                     |
| `ROLE ARN`                 | Your IAM Role unique ID. The active Session will refer to this Role.                                     |

![](../../images/screens/newuxui/aws-iam-role-federated.png?style=center-img "Add AWS IAM Role Federated Screen")

## Video tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/aws-iam-federated.mp4" type="video/mp4"> </video>
