---
title: ""
description: ""
pageType: "integration"
structuredData:
    howTo:
        title: ""
        tip1: ""
        tip2: ""
        tip3: ""
        tip4: ""
social:
    title: ""
    description: ""
    relativeImagePath: ""
sitemap:
    video:
        title: ""
        content: ""
---

AWS Single Sign-On (AWS SSO) is a cloud service that allows you to grant your users access to AWS resources across multiple AWS accounts.

AWS SSO provides a directory that you can use to create users, organize them in groups, and set permissions across those groups; alternatively, you can obtain them from your Microsoft Active Directory or any standards-based identity provider, such as Okta Universal Directory or Azure AD.

After logging in the first time, Leapp will map all your roles and users into Sessions.  

!!! Info

    To get started using AWS SSO refer to [this guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html){: target='_blank'}.

## Fields

| Field               | Description                                                                                                                                                    |
| --------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
|  `INTEGRATION TYPE` | Set as *AWS Single Sign-on*                                                                                                                                    |
| `AWS SSO URL`       | **The portal URL to begin the authentication flow.** It usually follows this pattern: `d-xxxxxxxxxx.awsapps.com/start`.                                        |
| `REGION`            | **The region on which AWS SSO is administered and configured.** This is NOT where your generated credentials will be valid, it's only used for the login part. |

![](../../images/screens/newuxui/aws-sso.png?style=center-img 'Add AWS SSO Screen')

## Video Tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/aws-sso.mp4" type="video/mp4"> </video>
