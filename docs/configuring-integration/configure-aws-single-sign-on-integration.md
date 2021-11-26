AWS Single Sign-On (AWS SSO) is a cloud service that allows you to grant your users access to AWS resources across multiple AWS accounts.

AWS SSO provides a directory that you can use to create users, organize them in groups, and set permissions across those groups; or you can bring them from your Microsoft Active Directory or a standards-based identity provider, such as Okta Universal Directory or Azure AD.

After logging in the first-time, Leapp will map all your roles and users into Sessions.  

!!! Info

    To get started in using AWS SSO refer to [this guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html).

## Fields

| Field               | Description                          |
| --------------------| ------------------------------------ |
| `AWS SSO URL`       | **The portal URL to begin the authentication flow.** It's usually in the form `d-xxxxxxxxxx.awsapps.com/start`. |
| `REGION`            | **The region on which AWS SSO is administered and configured.** This is NOT where your generated credentials will be valid, it's only used for login. |

![](../../images/screens/aws-sso.png?style=center-img 'Add AWS SSO Screen')

## Video Tutorial

![](../../videos/sso.gif?style=center-img)
