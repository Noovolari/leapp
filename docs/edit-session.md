With the latest release, Leapp comes with the **ability for the user to edit an existing session** (excluding those generated from an AWS integration).

To edit an existing session just *right-click on a session* in the Leapp list (see below), and select "edit session".

A new modal will be up letting the user choose which parameters to change.

![edit session](../../images/editsession.png)

Below are the configuration options for every type of session:

### Iam User
- Session Alias
- Named Profile
- AWS Region
- Mfa Device (optional)
- Access Key ID
- Secret Access Key

### IAM Role Chained
- Session Alias
- Named Profile
- AWS Region
- Role ARN
- Role Session Name
- Assumer Session

!!! Info

    You can also generate a new IAM Role Chained session from any other AWS session by right-clicking on a session and chosing "Create Chained Session"

### IAM Role Federated
- Session Alias
- Named RPofile
- AWS Region
- Role ARN
- SAML 2.0 Url
- Identity Provider

### Azure
- Session Alias
- Subscription ID
- Tenant ID
- Location

After modifying all the parameters, an option to test if they are valid is *test credential generation*:

![](../../images/testconnection.png)

Clicking this link allow Leapp to do a dry run on your parameters, if valid a new set of credentials will be generated (but not used) and a successfull toast will appear.
