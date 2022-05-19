### What is Credential Process?

[Credential Process](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html) is a configuration option 
(in the AWS config file) that instruct the AWS CLI and SDKs to use an external command to generate valid credentials in a specific format. 

It is **a way to generate AWS compatible credentials on the fly**, only when requested by tools that respect the AWS credential chain.

Credential Process **is perfect if you have a way to generate or look up credentials that isn't directly supported by the AWS CLI or third-party tools**; 
for example, you can configure the AWS CLI to use it by configuring the credential_process setting in the config file.

The difference between Credential Process and Standard Credential file is that **credentials in the "credential file" are written in plain text** and so, 
they are potentially unsecure, even if temporary. Credential process instead, generates **credentials that are consumed only when they are effectively needed**. 

> No credential is written in any file. They are *printed* on the stdout and consumed upon request.

### How Credential Process works?

Credentials process ask an external process to generate an AWS compatible temporary credential set in this format:
```json
{
  "Version": 1,
  "AccessKeyId": "an AWS access key",
  "SecretAccessKey": "your AWS secret access key",
  "SessionToken": "the AWS session token for temporary credentials", 
  "Expiration": "ISO8601 timestamp when the credentials expire"
}  
```

The **Expiration** field allows the generated credentials to be cached and reused until they are no more valid (by default the value is **3600s=1h**).

### Advantages
- Ensures that no credential set is written on your machine in neither the ~/.aws/credentials or ~/.aws/config files.
- Ensures your **long-running tasks** to always have valid credentials during their lifecycle.
- Is **compatible with named-profiles**.
- Is **a way to make third-party tool compatible with AWS SSO and SAML Federated IAM Principals** even if they don't support them natively.
- As stated by [this article](https://ben11kehoe.medium.com/never-put-aws-temporary-credentials-in-env-vars-or-credentials-files-theres-a-better-way-25ec45b4d73e) by Ben Kehoe, Credential Process is a good way to avoid cluttering the credential file with temporary credentials.

!!! Warning

    Temporary credentials in the credentials file reduce **potential blast radius** in case of machine exploit but they require to be refreshed everytime they expire.

### How Leapp works with Credential Process

!!! Info

    **Requirements**: this credentials' generation method requires that both Leapp desktop app and CLI are installed.

1) Open your Leapp desktop app and go to the settings panel (<img src="../../images/gear.png" width="20"/>).

2) In the *general section* change the *AWS Credential Generation* from "credential-file-method" to **"credential-process-method"**.

3) An informative panel will show app telling that you need the CLI installed (see below), click on "I acknowledge it"

![warning modal](../../images/modalcredentialprocess.png)

4) Now, everytime you click on start (<img src="../../images/startsession.png" width="20" />) an entry will be created in the ~/.aws/config file with the following format:

```yaml
[profile PROFILE_NAME]
credential_process=leapp session generate SESSION_ID
region=REGION
```

5) You can start more than one session, depending on how many named-profile you've created; 
for every session started with a unique named-profile a new entry will be created in the config file.

!!! Info

    AWS CLI, SDks, and third-party tools that can read credentials from the config file can reach AWS services with this method.
