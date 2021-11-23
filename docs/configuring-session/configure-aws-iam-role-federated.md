AWS Identity and Access Management (IAM) supports identity federation for delegated access to the AWS Management Console or AWS APIs. With identity federation, external identities are granted secure access to resources in your AWS accounts through IAM roles.

These external identities can come from your corporate identity provider (such as Microsoft Active Directory or from the AWS Directory Service) or from a web identity provider (such as Amazon Cognito, Login with Amazon, Facebook, Google, or any OpenID Connect-compatible provider).

We currently support only SAML 2.0 federation.

!!! Info
    - Refer to [this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_saml.html) to provision your own federated roles.
    - Refer to [this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_saml.html) to configure and trust your SAML 2.0 Identity Provider.

## Fields

| Field                      | Description                          |
| -------------------------- | ------------------------------------ |
| `ALIAS`                    | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to search for it inside Leapp. |
| `NAMED PROFILE`            | Your friendly session name in the AWS credential file. You will be able to reference from the AWS CLI with the `--name`. |
| `REGION`                   | Your default region of choice. Select the one which you use the most for this Session. |
| `SAML 2.0 URL`             | Your SAML URL interface to start the authentication flow to log in your Identity provider.  |
| `AWS IDENTIY PROVIDER ARN` | Your Identity Provider ID in AWS. You can find it in IAM section Identity Providers.|

![](../../images/screens/aws-iam-role-federated.png?style=center-img "Add AWS IAM Role Federated Screen")
