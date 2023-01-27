---
title: "Configure an AWS Single Sign-On integration"
description: "AWS Single Sign-On (AWS SSO) is a cloud service that allows you to grant your users access to AWS resources across multiple AWS accounts."
pageType: "integration"
structuredData:
    howTo:
        title: "Configure an AWS Single Sign-On integration"
        tip1: "Click on the _Add integration_ button in the sidebar"
        tip2: "Select AWS Single Sign-On as _Integration type_"
        tip3: "Provide the required information (described in the next section)"
        tip4: "Click on the _Add integration_ button"
social:
    title: "Configure an AWS Single Sign-On integration"
    description: "AWS Single Sign-On (AWS SSO) is a cloud service that allows you to grant your users access to AWS resources across multiple AWS accounts."
    relativeImagePath: "aws-single-sign-on-integration.png"
sitemap:
    video:
        title: "Configure an AWS Single Sign-On integration"
        content: "newuxui/aws-sso.mp4"
---

## What is AWS Single Sign-On

AWS Single Sign-On (AWS SSO) is a cloud service that allows you to grant your users access to AWS resources across multiple AWS accounts.

AWS SSO provides a directory that you can use to create users, organize them in groups, and set permissions across those groups; alternatively, you can obtain them from your Microsoft Active Directory or any standards-based identity provider, such as Okta Universal Directory or Azure AD.

After logging in the first time, Leapp will map all your roles and users into Sessions.  

!!! Info

    To get started using AWS SSO refer to [this guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html){: target='_blank'}.

## How to configure an AWS Single Sign-On integration in Leapp

1. "Click on the _Add integration_ button in the sidebar"
2. "Select AWS Single Sign-On as _Integration type_"
3. "Provide the required information (described in the next section)"
4. "Click on the _Add integration_ button"

## Required information

| Field              | Description                                                                                                                                                    |
| -------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `INTEGRATION TYPE` | Set as *AWS Single Sign-on*                                                                                                                                    |
| `AWS SSO URL`      | **The portal URL to begin the authentication flow.** It usually follows this pattern: `d-xxxxxxxxxx.awsapps.com/start`.                                        |
| `REGION`           | **The region on which AWS SSO is administered and configured.** This is NOT where your generated credentials will be valid, it's only used for the login part. |

![](../../images/screens/newuxui/aws-sso.png?style=center-img 'Add AWS SSO Screen')

## Video tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/aws-sso.mp4" type="video/mp4"> </video>
