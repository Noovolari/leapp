An AWS Identity and Access Management (IAM) user is an entity that you create in AWS to represent the person or application that uses it to interact with AWS.

A IAM User in AWS consists of a name and a set of long-term credentials. Leapp never set these values in the configuration files, and automatically generates and refresh a set of short-term credentials to make available.

!!! Info
  
    If you want to know how Leapp generates and refresh short-term credentials refer to [this section]() in the documentation.

## Fields

| Field               | Description                          |
| --------------------| ------------------------------------ |
| `ALIAS`             | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to search for it inside Leapp. |
| `NAMED PROFILE`     | Your friendly session name in the AWS credential file. You will be able to reference from the AWS CLI with the `--name`. |
| `REGION`            | Your default region of choice. Select the one which you use the most for this Session. |
| `MFA DEVICE ARN`    | Your MFA device ID to set up multi-factor authentication. See below how to achieve that. |
| `ACCESS KEY ID`     | Your long-term Access Key. It will be used to generate a short-term set of credentials. Don't disclose it to anyone. |
| `SECRET ACCESS KEY` | Your long-term Secret Key. It will be used to generate a short-term set of credentials. Don't disclose it to anyone. |

![](../../images/screens/aws-iam-user.png?style=center-img "Add AWS IAM User Screen")

## Video Tutorial

![](../../videos/User.gif?style=center-img)
