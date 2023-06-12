---
title: "Configure AWS IAM User"
description: "How to configure AWS IAM User session. An AWS IAM user is an entity that you create in AWS to represent the person or application that interact with AWS."
page_type: "session"
structured_data_how_to_title: "Configure AWS IAM User"
structured_data_how_to_tip1: "From the top bar, click on the plus icon to add a new session."
structured_data_how_to_tip2: "Select _Amazon AWS_ as the Cloud Provider."
structured_data_how_to_tip3: "Provide the required information (described in the next section)."
structured_data_how_to_tip4: "Click on the _Create Session_ button."
social_title: "Configure AWS IAM User"
social_description: "How to configure AWS IAM User session. An AWS Identity and Access Management (IAM) user is an entity that you create in AWS to represent the person or application that uses it to interact with AWS."
social_relative_image_path: "aws-iam-user-session.png"
sitemap_video_title: "Configure AWS IAM User"
sitemap_video_content: "newuxui/aws-iam-user.mp4"
---

## What is an AWS IAM User session

An AWS Identity and Access Management (IAM) user is an entity that you create in AWS to represent the person or application that uses it to interact with AWS.

An IAM User in AWS consists of a name and a set of long-term credentials. Leapp never sets these values in the configuration files, and automatically generates and refreshes a set of short-term credentials.

!!! Info
  
    If you want to know how Leapp generates and refresh short-term credentials refer to the [credentials generation](../../security/credentials-generation/aws/){: target='_blank'} section in the documentation.

## How to configure an AWS IAM User in Leapp

1. From the top bar, click on the plus icon to add a new session.
2. Select _Amazon AWS_ as the Cloud Provider.
3. Select _AWS IAM User_ as the access method. 
4. Provide the required information (described in the next section). 
5. Click on the _Create Session_ button.

## Required information

| Field           | Description                          |
|-----------------| ------------------------------------ |
| `SESSION ALIAS` | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to find inside Leapp. |
| `NAMED PROFILE` | Your friendly session name in the AWS credential file. You will be able to reference it from the AWS CLI with `--name`. |
| `REGION`        | Your default region of choice. Select the one which you use the most for this Session. |
| `MFA DEVICE`    | Your MFA device ID to set up multi-factor authentication. |
| `ACCESS KEY ID` | Your long-term Access Key. It will be used to generate a short-term set of credentials. Don't disclose it to anyone. |
| `SECRET ACCESS KEY` | Your long-term Secret Key. It will be used to generate a short-term set of credentials. Don't disclose it to anyone. |

![Add AWS IAM User Screen](../../images/screens/newuxui/aws-iam-user.png)

## Video tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/aws-iam-user.mp4" type="video/mp4"> </video>
