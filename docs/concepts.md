# Concepts
Leapp grants the users the generation of **temporary credentials** for accessing the cloud programmatically through CLI/SDK.

Leapp is built with security in mind: **NO credentials are saved in our system whatsoever. Nor in code neither in our configuration file.** Every time a credential is generated is **temporary**, and **no long-term ones are ever saved** in plain accessible files or locations.

Our main goal is to provide credentials to developers only when needed. Otherwise, those credentials are stored in a secure place (the system vault).

## Session

A **Session** contains all the relevant information to let the dev connect to a cloud provider.

Three standard actions should be implemented for each session: **start**, **stop**, and **rotate**.

### Start
Make the temporary credentials available to the provider chain.

### Stop
Removes the temporary credentials from the provider chain.

### Rotate
Generate new temporary credentials, and substitute the previous ones in the provider chain.

## Data
All Sessions shares some basic data, common to all. 

### ID
Unique identifier to the Session

### sessionName
A fancy name for the Session to make it recognizable to the user.

### status
Represent the **State Management** of a single session; when the **status** of a session is **`ACTIVE`,** temporary credentials are available to the user.

### startDateTime
A UTC DateTime string representing the last time a specific Session has started; this is useful for rotation and sorting purposes.

### region
The AWS region or Azure Location the Session is working on.

### type
Uniquely identifies two central aspects to determine the Session: **Cloud Provider** and **Access Method.**

## Access Method

**Type** identifies two central aspects to determine the Session: **Cloud Provider** and **Access Method.**

The naming convention we are using is `cloudProvider-accessMethod`.

- the **Cloud Provider** on which you are connecting (i.e., AWS, Azure, GCP...)
- the **Access Method** used to generate credentials (i.e., AWS IAM User, Azure Tenant, AWS IAM Role...)

The process of setting up Leapp Sessions is managed either **manually**, for each access method, or through **integrations** with third-party tools.

Leapp stores all the Sessions available to the users locally, inside a configuration file called **Workspace.**

## Workspace

This model represents the configuration that will be serialized and persisted into the *`.Leapp/Leapp-lock.json`* file.

This file is encrypted using **AES-256 encryption algorithm** and the **machine id** as **encryption key**.

This model contains the fields described below.

- **sessions**

  The list of Sessions created through Leapp.

- **defaultRegion**

  It corresponds to AWS's default region to which API calls are sent. The default region for AWS is *`us-east-1`*.

- **defaultLocation**

  It corresponds to Azure's default region to which API calls are sent. The default region for Azure is *`eastus`*.

- **idpUrls**

  A list of all the Identity Provider URLs used from AWS IAM Roles Federated Sessions.

- **profiles**

  The list of profiles - characterized by an *id* and a *name* - that can be associated with Sessions.

## Integrations

Session integration is referred to as a process of bringing data coming from different sources to Leapp.

Tools like AWS Single Sign-On, OneLogin Multi-Account AWS Access, Okta AWS Multi-Account, and Hashicorp Vault, grants the developers a list of all the available Cloud environment they can access.

An integration can map an available Cloud environment they can access, to a **Leapp Session** and automatically add it in-app.

Each integration is linked to a specific **Access Method** to generate credentials for a specific Cloud Provider from the information inside a **Session.**
