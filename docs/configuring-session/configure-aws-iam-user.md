An AWS Identity and Access Management (IAM) user is an entity that you create in AWS to represent the person or application that uses it to interact with AWS.

An IAM User in AWS consists of a name and a set of long-term credentials. Leapp never sets these values in the configuration files, and automatically generates and refreshes a set of short-term credentials.

!!! Info
  
    If you want to know how Leapp generates and refresh short-term credentials refer to the [credentials generation](/security/credentials-generation/aws/) section in the documentation.

## Fields

| Field           | Description                          |
|-----------------| ------------------------------------ |
| `SESSION ALIAS` | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to find inside Leapp. |
| `NAMED PROFILE` | Your friendly session name in the AWS credential file. You will be able to reference it from the AWS CLI with `--name`. |
| `REGION`        | Your default region of choice. Select the one which you use the most for this Session. |
| `MFA DEVICE`    | Your MFA device ID to set up multi-factor authentication. |
| `ACCESS KEY ID` | Your long-term Access Key. It will be used to generate a short-term set of credentials. Don't disclose it to anyone. |
| `SECRET ACCESS KEY` | Your long-term Secret Key. It will be used to generate a short-term set of credentials. Don't disclose it to anyone. |

![Add AWS IAM User Screen](../../images/screens/newuxui/aws-iam-user.png){: .centered-image}
## Video Tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/aws-iam-user.mp4" type="video/mp4"> </video>
