#Pre-install

No requirements are requested for **macOS** and **Windows** users.

## Pre-requisites for using on Linux systems
Leapp uses `libsecret` and `gnome-keyring` as dependencies to store all sensitive data into the keyring.
Depending on your distribution you **may** need to install them before running Leapp using these commands.

**Debian/Ubuntu:**
```
sudo apt-get install gnome-keyring
sudo apt-get install libsecret-1-dev
```
**Red Hat-based:**
```
sudo yum install gnome-keyring
sudo yum install libsecret-devel
```
**Arch Linux:**
```
sudo pacman -S gnome-keyring
sudo pacman -S libsecret
```

##Pre-requisites for logging into EC2 Instances via AWS SSM with Leapp 

In order to use AWS SSM on your System through Leapp, you must be able to execute this command 
on your own at least once when suitable credentials are active.

```bash
aws ssm start-session --region <region> --target <instanceId>
```

If for any reason this command fails, please verify to have **Python 3.x installed**:

```
https://www.python.org/downloads/
```

Also verify that the **AWS SSM Agent** is installed correctly by following the official AWS guide:

```
https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent-v3.html
```
