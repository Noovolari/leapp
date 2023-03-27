---
title: "Configure AWS IAM Role Chained"
description: "How to configure an AWS IAM Role Chained session. An AWS IAM Role Chained session represents an AWS role chaining access. Role chaining is the process of assuming a role starting from another IAM role or user."
page_type: "session"
structured_data_how_to_title: "Configure AWS IAM Role Chained"
structured_data_how_to_tip1: "From the top bar, click on the plus icon to add a new session."
structured_data_how_to_tip2: "Select _Amazon AWS_ as the Cloud Provider."
structured_data_how_to_tip3: "Select _AWS IAM Role Chained_ as the access method."
structured_data_how_to_tip4: "Provide the required information (described in the next section)."
structured_data_how_to_tip5: "Click on the _Create Session_ button."
social_title: "Configure AWS IAM Role Chained"
social_description: "How to configure an AWS IAM Role Chained session. An AWS IAM Role Chained session represents an AWS role chaining access. Role chaining is the process of assuming a role starting from another IAM role or user."
social_relative_image_path: "aws-iam-role-chained-session.png"
sitemap_video_title: "Configure AWS IAM Role Chained"
sitemap_video_content: "newuxui/aws-iam-chained.mp4"
---

## What is an AWS IAM Role Chained session

An AWS IAM Role Chained session represents an AWS role chaining access. Role chaining is the process of assuming a role starting from another IAM role or user.

An IAM role has some similarities to an IAM user. Roles and users are both AWS identities with permissions policies that determine what the identity can and cannot do in AWS. However, instead of being uniquely associated with one person, a role is intended to be assumable by anyone who needs it.

A role does not have standard long-term credentials such as a password or access keys associated with it. Instead, when you assume a role, it provides you with temporary security credentials for your role session.

Role chaining occurs when you use a role to assume a second role through the AWS CLI or API, even in other accounts.

!!! Info
    Refer to [this guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_saml.html){: target='_blank'} to delegate access across AWS accounts using IAM Roles chaining.

## How to configure an AWS IAM Role Chained in Leapp

1. From the top bar, click on the plus icon to add a new session.
2. Select _Amazon AWS_ as the Cloud Provider.
3. Select _AWS IAM Role Chained_ as the access method.
4. Provide the required information (described in the next section).
5. Click on the _Create Session_ button.

## Required information

| Field               | Description                          |
|---------------------| ------------------------------------ |
| `SESSION ALIAS`     | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to find inside Leapp. |
| `NAMED PROFILE`     | Your friendly session name in the AWS credential file. You will be able to reference it from the AWS CLI with `--name`. |
| `REGION`            | Your default region of choice. Select the one which you use the most for this Session. |
| `ROLE ARN`          | Your IAM Role unique ID. The active Session will refer to this Role. |
| `ROLE SESSION NAME` | Your session name. You can query and search this on AWS Cloudtrail or any other linked audit service to find out what action were performed by the linked Identity. |
| `ASSUMER SESSION`   | Your session from which this Role will be assumed. The `assume-role` call will be automatically made by Leapp. |

![](../../images/screens/newuxui/aws-iam-role-chained.png?style=center-img "Add AWS IAM Role Chained Screen")

## Video tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/aws-iam-chained.mp4" type="video/mp4"> </video>
