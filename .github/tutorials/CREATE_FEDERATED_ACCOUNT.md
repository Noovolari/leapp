# How to create a Federated Account for AWS with Leapp

If this is your first time accessing Leapp please follow this guide: [First setup](FIRST_SETUP.md).

1) From your quick list click on the "+" button located on the top-right corner of the app

![CREATE FEDERATED ACCOUNT 1](../images/CREATE_GENERIC_1.png)

You'll be presented with the **Provider Selection** screen:

![CREATE FEDERATED ACCOUNT 2](../images/FIRST_SETUP_1.png)

2) Choose "**AWS**" as a Cloud Provider, than you'll be presented with the **Access Strategy** selection screen:

![CREATE_FEDERATED_ACCOUNT_3](../images/CREATE_GENERIC_2.png)

Select "**Federated**" as the Access Strategy.

3) As the last screen you'll be presented with the actual account creation screen:

![CREATE_FEDERATED_ACCOUNT_4](../images/CREATE_FEDERATED_ACCOUNT_2.png)

- **Account Alias:** choose a unique name suitable to recognize the Access Strategy.
- **Account Number**: Grab the account number from your aws account (Go to IAM service and check for the bottom-left screen).

    ![CREATE FEDERATED ACCOUNT 5](../images/CREATE_GENERAL_3.png)

- **Role**: Write the name of the role you want to assume inside your Federated Account.
- **IdpARN**: Is the Idp ARN you can recover by going into your AWS Account → IAM service → Identity Providers → Select your GSUITE federation → copy the ARN value as shown in the screenshot:

    ![CREATE FEDERATYED ACCOUNT 6](../images/CREATE_FEDERATED_3.png)

Finally press **Save**.
