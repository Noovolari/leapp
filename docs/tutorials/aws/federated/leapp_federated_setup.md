# How to create a Federated Role Access Method for AWS with Leapp

If this is your first time accessing Leapp please follow this guide: [First setup](FIRST_SETUP.md).

#### 1) From your quick list click on the "+" button located on the top-right corner of the app

You'll be presented with the **Provider Selection** screen:

<img width="515" alt="1" src="https://user-images.githubusercontent.com/9497292/123762870-8108ec00-d8c3-11eb-84f4-d0a06d866d5c.png">

#### 2) Choose "**AWS**" as a Cloud Provider, than you'll be presented with the **Access Strategy** selection screen:

<img width="514" alt="2" src="https://user-images.githubusercontent.com/9497292/123763231-dc3ade80-d8c3-11eb-9ebf-edbfc6aaf1d3.png">

Select "**IAM Federated Role**" as the Access Method.

#### 3) As the last screen you'll be presented with the actual account creation screen:

<img width="516" alt="Screenshot 2021-06-29 at 10 23 49" src="https://user-images.githubusercontent.com/9497292/123763843-7dc23000-d8c4-11eb-88b1-2ee90357951f.png">

- **AWS Profile**: here you can select (ora add by writing and pressing ENTER) a named profile to use for this credential set, base one is "default"
- **Session Alias:** choose a unique name suitable to recognize the Access Method.
- **Role ARN**: Grab the Role ARN from your AWS account (Go to IAM service → Roles, and check for the [federated role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_saml.html)).
- **Region**: select the region you want to start your session in.
- **SAML 2.0 Url**: here you can select (ora add by writing and pressing ENTER) a SAML 2.0 URL to use with your Federated Account.
- **IdpARN**: Is the Idp ARN you can recover by going into your AWS Account → IAM service → Identity Providers → Select your GSUITE federation → copy the ARN value.

Finally press **Save**.
