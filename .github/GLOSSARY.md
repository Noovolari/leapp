
# Identity Provider

Trusted system entity responsible for managing information of principals and provide authentication. Leapp defines **only one** Identity Provider to have a single identity source to access the multi-cloud environment.

# Principal

An entity managed and trusted by an Identity Provider, which the Identity can authenticate against.

# Cloud Service Provider

Provides cloud services and allows the creation and management of resources inside isolated accounts. The provided services can be consumed through well defined and documented web APIs, CLI, and SDK.

# Federation

The process to establish a trust relationship between the Identity Provider and a Cloud Provider account. Enables Developers and DevOps to access the cloud assets in the federated account through Single Sign-On authentication against the Identity Provider.

## Example: Federation between G Suite and AWS

Developer/DevOps authenticates against the Identity Provider through a URL that represents a SAML Application in the context of G Suite. Once authenticated, the client uses the SAML assertion, returned by the Identity Provider in the authentication phase, to invoke AWS' assume-role-with-saml API; this returns a set of valid credentials associated with a role in the Federated AWS account.

# Trusting

The process to establish a trust relationship between two roles in different accounts of the same cloud provider. This access method requires a role in a federated account and a role in a truster account and leverage a single federation definition to access other accounts.

## Example: Trusting between AWS Roles

Developer/DevOps use a set of valid credentials from the Federated Account and invoke AWS assume-role API targeting the Truster Role. It's required a trust relationship on the Truster Role to allow the assume-role API to be called from the Federated Role. To further enhance the security, a policy that restricts the assume-role action to the Truster Role is associated to the Federated Role.

# Cloud Asset

Service or computational resource delivered by a Cloud Service Provider.

# Cloud Account

Cloud Provider account that contains isolated Cloud Assets. We distinguish between Federated and Trusting Accounts.

### Federated Account

Cloud Account where is present a trust relationship with the Identity Provider.

### Truster Account

Cloud Account which is not federated and where is present a trust relationship with a role in a Federated Account.

# Cloud Role

An entity in a Cloud Account that is granted access to Cloud Assets through a set of permissions. The Identity can access the Cloud Account and its assets through the Cloud Role and interact accordingly to the given permission set.

### Federated Role

Cloud Role in a Federated Account that can be assumed by a Principal.

### Truster Role

Cloud Role in a Truster Account that can be assumed by a Principal through a Federated Role.

# Assume Role

Action in a role-based access control system that lets an entity with a given set of permissions to impersonate another entity with a different set of permissions. A trust relationship enables entities to perform this action from different Cloud Accounts.

# Cloud Policy

It's a set of rules and permissions associated with a Cloud Role. It defines access rights to Cloud Assets and the right to perform an Assume Role action. Leapp distinguishes between Access and Trust Policies.

### Access Policy

The policy that grants permissions to perform actions in a Cloud Account.

### Trust Policy

The policy that implements the trust relationship between two entities.

Federation on Federated Roles and trusting on Truster Roles.

# Application

Raggruppamento logico, definito all’interno di un **Identity Provider**, di un set di parametri che permettono il corretto processo di federazione tra un **Identity Provider** ed un **Cloud Account**. Al momento LookAuth supporta due tipi di **Application**.

A logical group of parameters defined inside the Identity Provider. This set of parameters enables a correct federation process between the Identity Provider and a Federated Account. As far as now, Leapp supports a single type of Application: G Suite SAML App.

### SAML App

G Suite's Application.

# IAM Identity Provider

It is an Amazon Web Services resource that provides an entry point to the Federated Account in which it is defined. It contains information about the Identity Provider federated to the Federated Account.

# Session

The session is the time frame where the user can perform a set of operations within the selected account and the role.
