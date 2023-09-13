---
title: "Configure Localstack"
description: "How to configure Localstack session"
page_type: "session"
structured_data_how_to_title: "Configure Localstack"
structured_data_how_to_tip1: "From the top bar, click on the plus icon to add a new session."
structured_data_how_to_tip2: "Select _Localstack_ as the Cloud Provider."
structured_data_how_to_tip3: "Provide the required information (described in the next section)."
structured_data_how_to_tip4: "Click on the _Create Session_ button."
---

## What is a Localstack session

With Localstack you can emulate AWS cloud services with a fully functional cloud stack on your local machine.
Develop and test your cloud applications with the full cloud experience, but without the hassle of the remote cloud.

You can use Leapp to create a Localstack session that can then be used to set your local credential file and access your Localstack resources.

!!! Info

    You need to [install Localstack](https://docs.localstack.cloud/getting-started/){: target='_blank'} in order to use the AWS cloud emulation features


## How to configure a Localstack session in Leapp

1. From the top bar, click on the plus icon to add a new session.
2. Select _Localstack_ as the Cloud Provider. 
3. Provide a name for the session. 
4. Click on the _Create Session_ button.

!!! Warning

    Localstack sessions work only with [AWS Credential Method](../security/credentials-generation/aws.md) configured with the `credential-file-method` option. 
    The option is available in the _Options_ menu > _General_ > _Generics_ > _AWS Credential Method_.

!!! Warning

    In order to use the credential file to access Localstack from your AWS CLI, you must update the AWS CLI to the [latest version](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html){: target='_blank'}.
