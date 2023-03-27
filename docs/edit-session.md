Leapp allows the user to **edit an existing session** excluding those generated from an AWS integration.

!!! Info
  
    Integration derived Sessions can’t be changed

To edit an existing session just *right-click on a session* in the Leapp list (see below), and select "edit session".
A new modal will appear, allowing the user to choose which parameters to change.

![edit session](../images/editsession.png)

Below are the configuration options for every type of session:

### Iam User
- Session Alias: the session name can be changed, as a session is identified by a hidden id
- Named Profile: you can change a named profile and the session, if active, will restart itself
- AWS Region: you can change the region and the session will restart itself, if active
- Mfa Device (optional): can be left empty or, if you add a valid device name or AWS ARN, it will prompt a modal for MFA code
- Access Key ID: Replace your session Access Key ID in the system vault
- Secret Access Key: Replace your session Secret Access Key in the system vault

### IAM Role Chained
- Session Alias: the session name can be changed, as a session is identified by a hidden id
- Named Profile: you can change a named profile and the session, if active, will restart itself
- AWS Region: you can change the region and the session will restart itself, if active
- Role ARN: The role that you'll assume when chaining from an assumer window
- Role Session Name: (optional), it will be used to identify the chained session
- Assumer Session: select a session from the list, it will be the Principal assuming the role

!!! Info

    You can also generate a new IAM Role Chained session from any other AWS session by right-clicking on a session and chosing "Create Chained Session"

### IAM Role Federated
- Session Alias: the session name can be changed, as a session is identified by a hidden id
- Named Profile: you can change a named profile and the session, if active, will restart itself
- AWS Region: you can change the region and the session will restart itself, if active
- Role ARN: Role of the Principal in AWS
- SAML 2.0 Url: Federated URL needed for authentication to AWS
- Identity Provider: the identity provider ARN that you have set up on AWS

After modifying all the parameters, a user can test their validity with *test credential generation*:

![](../images/testconnection.png)

Clicking this button allows Leapp to do a dry run on your parameters, and if valid, a new set of credentials 
will be generated (but not used) and an informative toast will appear to tell you that they can be used successfully.

### How we handle Secrets when Editing a Session

**No secrets will be saved in plain text on your machine**. 
Leapp saves secrets by replacing values in the system keychain, 
using a combination of an informative name plus the session hidden id.

This way we reduce potential blast radius of an attacker tampering your machine.

When editing a session, Leapp will hide your secrets and you are also **unable to copy/paste them from the App**.
