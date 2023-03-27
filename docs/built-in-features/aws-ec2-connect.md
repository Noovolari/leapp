---
title: "Configure AWS EC2 Connect"
description: "How to configure AWS EC2 Connect. You can directly connect to an AWS EC2 instance from Leapp through AWS System Manager (AWS SSM)."
page_type: "built-in"
structured_data_how_to_title: "Configure AWS EC2 Connect"
structured_data_how_to_tip1: "Right-click on a suitable AWS session to open the contextual menu. Click on View SSM sessions."
structured_data_how_to_tip2: "Select the AWS region in which your instance is located. Wait for Leapp to load your instances."
structured_data_how_to_tip3: "Select the instance and click connect. Wait for the terminal to open."
structured_data_how_to_tip4: "Focus the terminal window and write ```/bin/bash```; press  ++return++  and you'll be inside the terminal of your instance."
social_title: "Configure AWS EC2 Connect"
social_description: "How to configure AWS EC2 Connect. You can directly connect to an AWS EC2 instance from Leapp through AWS System Manager (AWS SSM)."
social_relative_image_path: "configure-ec2-connect.png"
sitemap_video_title: "Configure AWS IAM User"
sitemap_video_content: "newuxui/ssm.mp4"
---

## What is AWS EC2 Connect

Amazon EC2 Instance Connect is a simple and secure way to connect to your instances using Secure Shell (SSH). 
With EC2 Instance Connect, you can control SSH access to your instances using AWS Identity and Access Management (IAM) policies
as well as audit connection requests with AWS CloudTrail events.

## How To configure AWS EC2 Connect in Leapp

!!! Warning

    If your Leapp Desktop App is warning you that you're missing the **AWS Session Manager Plugin**, please install it following this official [guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html){: target='_blank'}.

You can directly connect to an AWS EC2 instance from Leapp through AWS System Manager (AWS SSM).

!!! Info

    To setup SSM follow [this SSM guide on AWS](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started.html){: target='_blank'} guide.

![example image from AWS](../../images/screens/newuxui/aws-ssm.png?style=center-img)

To correctly connect follow these steps:

1. Right-click on a suitable AWS session to open the contextual menu.
2. Click on View SSM sessions.
3. Select the AWS region in which your instance is located.
4. Wait for Leapp to load your instances.
5. Select the instance and click connect.
6. Wait for the terminal to open.
7. Focus the terminal window and write ```/bin/bash```; press  ++return++  and you'll be inside the terminal of your instance.

## Video tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/ssm.mp4" type="video/mp4"> </video>

!!! Warning

    If the user is not granted the right permissions, the operation will fail and Leapp will throw an error message.


