## How to connect to an EC2 instance through Leapp using AWS SSM

### Prerequisites
In order to **connect properly to a remote EC2 instance** using SSM **is necessary to configure the agent and appropriate permissions via AWS console**.

To configure **access** to one or more instances through SSM, follow the steps defined in this [guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started.html).

In particular, you'll also want to check:
- How to set up an SSM Agent for [Linux](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-install-ssm-agent.html) EC2 instances
- How to set up an SSM Agent for [MacOS](https://docs.aws.amazon.com/systems-manager/latest/userguide/install-ssm-agent-macos.html) EC2 instances
- How to set up an SSM Agent for [Windows](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-install-ssm-win.html) EC2 instances

By default, AWS Systems Manager doesn't have permission to connect to your instances. You must grant access by using an AWS IAM instance profile. To do so, follow this [step](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started-instance-profile.html).

<br>

### Launching an AWS SSM Session using Leapp

With Leapp it is possible to launch a remote session over an AWS EC2 instance by simply clicking on the **kebab menu** near the session information like in the figure.

<img width="513" alt="Screenshot 2021-07-06 at 15 35 01" src="https://user-images.githubusercontent.com/9497292/124609753-331a5800-de70-11eb-888f-27d3cc031350.png"><br><br>

In the context menu, choose **SSM Session**.

<img width="476" alt="Screenshot 2021-07-06 at 15 37 11" src="https://user-images.githubusercontent.com/9497292/124609961-64932380-de70-11eb-9bd7-bdf873a5a9d5.png"><br><br>

In the modal that should open select the **region** in which your EC2 instance resides. After loading all the available instances in that region, it will be possible to connect.


<img width="508" alt="Screenshot 2021-07-06 at 15 43 39" src="https://user-images.githubusercontent.com/9497292/124611099-6a3d3900-de71-11eb-9b49-ce9f7f8568e7.png"><br><br>

After selecting the region if one or more instances are available you can SSM into that by clicking the **connect** button.

> Note that Leapp **will not** check if you're are eligible or not to connect, so in case of error, Leapp will stop the procedure telling what went wrong.

<img width="515" alt="Screenshot 2021-07-06 at 15 44 02" src="https://user-images.githubusercontent.com/9497292/124611106-6b6e6600-de71-11eb-8cf2-e49016251086.png"><br><br>

In case you have to manage many sessions you can always use the general **search bar** to filter the specific session you need.

<img width="515" alt="Screenshot 2021-07-06 at 15 44 12" src="https://user-images.githubusercontent.com/9497292/124611110-6c06fc80-de71-11eb-899d-011c81472d40.png"><br><br>

After clicking connect, a terminal will pop up on your system connecting to the selected instance. Once connected you should see a screen similar to this:

<img width="582" alt="Screenshot 2021-07-06 at 16 04 08" src="https://user-images.githubusercontent.com/9497292/124614010-1da72d00-de74-11eb-8076-4969d923575a.png"><br><br>

Here you'll have to type ```/bin/bash``` in order to fully connect to the machine. After that, you'll have complete remote access to the instance.
