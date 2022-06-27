You can directly connect to an AWS EC2 instance from Leapp through AWS System Manager (AWS SSM).

!!! Info

    To setup SSM follow [this](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started.html) guide.

![](../../images/screens/newuxui/aws-ssm.png?style=center-img)

!!! Warning

    On macOS, be sure to close all terminal/iTerm windows beforehand to use this feature correctly. 

To correctly connect follow these steps:

1. Right-click on a suitable AWS session to open the contextual menu
2. Click on View SSM sessions
3. Select the AWS region in which your instance is located
4. Wait for Leapp to load your instances
5. Select the instance and click connect
6. Wait for the terminal to open
7. Focus the terminal window and write ```/bin/bash```; press  ++return++  and you'll be inside the terminal of your Instance

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/ssm.mp4" type="video/mp4"> </video>

!!! Warning

    If the user is not granted the right permissions, the operation will fail and Leapp will throw an error message.


