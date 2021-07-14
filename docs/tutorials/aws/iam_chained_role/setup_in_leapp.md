# How to create a Truster Account from a Federated Account for AWS with Leapp

> **NOTE**: to create a chained session you either need a Federated, Plain, or SSO session first.

If this is your first time accessing Leapp please follow this [guide](../../first_access.md).

#### 1. From your quick list click on the "+" button located on the top-right corner of the app

You'll be presented with the **Provider Selection** screen:

![](../../../../images/tutorials/aws/iam_chained_role/AWS_IAM_CHAINED_ROLE_SETUP_IN_LEAPP-1.png)

#### 2. Choose "**AWS**" as a Cloud Provider, then you'll be presented with the **Access Method** selection screen:

![](../../../../images/tutorials/aws/iam_chained_role/AWS_IAM_CHAINED_ROLE_SETUP_IN_LEAPP-2.png)

Select "**IAM Chained Role**" as the Access Strategy.

#### 3. As the last screen you'll be presented with the actual account creation screen:

![](../../../../images/tutorials/aws/iam_chained_role/AWS_IAM_CHAINED_ROLE_SETUP_IN_LEAPP-3.png)

- **AWS Profile**: here you can select (ora add by writing and pressing ENTER) a named profile to use for this credential set, base one is "default"
- **Session Alias:** choose a unique name suitable to recognize the Access Method.
- **Region**: the region to start this credential set into once the section is active. You can always add a default one from option panel
- **Role ARN**: Write the role ARN of the chained role you want to assume inside your AWS Account.
- **Assumer Session**: any eligible session that you can use to start your chained session.

Finally press **Save**.
