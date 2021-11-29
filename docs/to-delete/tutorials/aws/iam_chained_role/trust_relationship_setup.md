# Create Trust Relationship between an AWS Federated Role and an AWS Chained Role

## Create a new Chained Role in the AWS Truster Account

### 1. Go to the IAM console
Go to the IAM console in your AWS Account and select Roles from the left-side column.

### 2. Create role
Click on **Create Role** and select **Another AWS account** as the type of trusted entity;
then, specify the Account ID (i.e. the Account Number) of the AWS Account that contains the
Federated Role that will assume the Truster Role that you're creating.

![](../../../../images/tutorials/aws/iam_chained_role/AWS_IAM_CHAINED_ROLE_SETUP_TRUST_RELATIONSHIP-1.png)

The Trust Policy associated to the newly created AWS Chained Role should look as follows.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {}
    }
  ]
}
```

In this Trust Policy **111122223333** corresponds to the AWS Federated Account's **Account ID**,
specified in the AWS Chained Role's creation wizard.

As you can see, the **Principal** attribute's value is **arn:aws:iam::111122223333:root**;
this value makes every IAM entity, inside the **111122223333** account, able to assume the AWS Chained Role.

If you want to restrict access to a specific AWS IAM Role/User in the AWS Federated Account,
you should specify the AWS IAM Role/User ARN as the **Principal** attribute's value.

### 3. Allow Programmatic and AWS Management Console access
Select **Allow programmatic and AWS Management Console access** and click on **Next: Permissions** button.

### 4. Add policy
Select the policy you want to attach to the newly created Role, e.g. *AdministratorAccess*.
Then, click **Next: Tags** button.

### 5. Tags definition
Add any tag you want if you need to. Then click **Next: Review**

### 6. Name the role
Assign a name to the Role and click **Create Role**.

## Edit an existing role
Go to the IAM console in your AWS Account and select Roles from the left-side column.

### 1. Select the role you want to edit
From the list of Roles, find the Role you want to edit and click on its **Role name**.
A summary of the role will be displayed.

### 2. Edit trust relationships
In the Role’s summary, click on the **“Trust relationships”** tab.
Click on **Edit trust relationship**, and you're able to modify it.

### 3. Update Trust Policy
Click on **“Update Trust Policy”** to save changes.
