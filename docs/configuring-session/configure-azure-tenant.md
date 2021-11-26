A dedicated and trusted instance of Azure AD that's automatically created when your organization signs up for a Microsoft cloud service subscription, such as Microsoft Azure, Microsoft Intune, or Microsoft 365. An Azure tenant represents a single organization.

An Azure Tenant consists of a name and a set of long-term credentials. Leapp enhances security of Azure credentials by removing .

!!! Info

    If you want to know how Leapp generates and refresh short-term credentials refer to [this section]() in the documentation.

## Fields

| Field               | Description                          |
| --------------------| ------------------------------------ |
| `ALIAS`             | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to search for it inside Leapp. |
| `SUBSCRIPTION ID`   | Your friendly session name in the AWS credential file. You will be able to reference from the AWS CLI with the `--name`. |
| `TENANT ID`         | Your default region of choice. Select the one which you use the most for this Session. |
| `LOCATION`          | Your MFA device ID to set up multi-factor authentication. See below how to achieve that. |

![](../../images/screens/azure.png?style=center-img "Add AWS IAM User Screen")
