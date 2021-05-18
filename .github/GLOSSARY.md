
# Identity Provider

Trusted system entity responsible for managing information of principals and provide authentication. 
Leapp defines **only one** Identity Provider to have a single identity source to access the multi-cloud environment.

# Principal

An entity managed and trusted by an Identity Provider, which the Identity can authenticate against.

# Cloud Service Provider

Provides cloud services and allows the creation and management of resources inside isolated accounts. 
The provided services can be consumed through well defined and documented web APIs, CLI, and SDK.

# Federation

The process to establish a trust relationship between the Identity Provider and a Cloud Provider account. 
Enables Developers and DevOps to access the cloud assets in the Federated Account through Single Sign-On 
authentication against the Identity Provider.

## Example: Federation between G Suite and aws

Developer/DevOps authenticates against the Identity Provider through a URL that represents a SAML Application 
in the context of G Suite. Once authenticated, the client uses the SAML assertion, returned by the Identity 
Provider in the authentication phase, to invoke aws' assume-role-with-saml API; this returns a set of valid 
credentials associated with a role in the Federated aws account.

# Trusting

The process to establish a trust relationship between two roles in different accounts of the same cloud provider. 
This access method requires a role in a Federated Account and a role in a Truster Account and leverage a single 
federation definition to access other accounts.

## Example: Trusting between aws Roles

Developer/DevOps use a set of valid credentials from the Federated Account and invoke aws assume-role API targeting 
the Truster Role. It's required a trust relationship on the Truster Role to allow the assume-role API to be called 
from the Federated Role. To further enhance the security, a policy that restricts the assume-role action to the Truster
Role is associated to the Federated Role.

# Cloud Asset

Service or computational resource delivered by a Cloud Service Provider.

# Cloud Account

Cloud Provider account that contains isolated Cloud Assets. We distinguish between Federated and Truster Accounts.

### Federated Account

Cloud Account where is present a trust relationship with the Identity Provider.

### Truster Account

Cloud Account which is not federated and where is present a trust relationship with a role in a Federated Account.

# Cloud User

An entity in a Cloud Account that is granted access to Cloud Assets through a set of permissions. 

# Cloud Role

An entity in a Cloud Account that is granted access to Cloud Assets through a set of permissions. The Principal 
can access the Cloud Account and its assets assuming the Cloud Role and interact accordingly to the given permission set.

### Federated Role

Cloud Role in a Federated Account that can be assumed by a Principal.

### Truster Role

Cloud Role in a Truster Account that can be assumed by a Principal through a Federated Role.

# Assume Role

Action in a role-based access control system that lets an entity with a given set of permissions 
to impersonate another entity with a different set of permissions. A trust relationship enables entities 
to perform this action from different Cloud Accounts.

# Cloud Policy

It's a set of rules and permissions associated with a Cloud Role. It defines access rights to Cloud Assets 
and the right to perform an Assume Role action. Leapp distinguishes between Access and Trust Policies.

### Access Policy

The policy that grants permissions to perform actions in a Cloud Account.

### Trust Policy

The policy that implements the trust relationship between two entities.

# Application

A logical group of parameters defined inside the Identity Provider. This set of parameters enables a correct 
federation process between the Identity Provider and a Federated Account. As far as now, Leapp supports a single 
type of Application: G Suite SAML App.

### SAML App

G Suite's Application.

# IAM Identity Provider

It is an Amazon Web Services resource that provides an entry point to the Federated Account in which it is defined. 
It contains information about the Identity Provider federated to the Federated Account.

# Access Strategy
A way to access a Cloud Account's assets through a set of credentials.

# Federated Access
It's a way to obtain access to cloud assets in an account federated with external Identity Provider.
Leapp currently supports 2 types of federated access:

- **aws Federated Access** - A strategy to allow a Principal on G Suite to access a Federated Account on aws. 
- **Azure Federated Access** - A strategy to allow access to one or more Azure Subscriptions, that belong to an Azure Tenant, through means of an Azure Active Directory.

# Plain Access

Direct access to an aws account via IAM User's credentials.

# Truster Access

A strategy to allow access to a Truster Account by passing through a Federated Account. 
That's an indirect way to access an aws account by granting a Federated Role permission 
to assume a Truster Role in the Truster Account.

# Session

The session is the time frame where the user can perform a set of operations within the selected account and the role.

# Azure Tenant

A tenant is the organization that owns and manages a specific instance of Microsoft cloud services. 
It’s most often used in a inexact manner to refer to the set of Azure AD and Office 365 services for 
an organization, e.g. “we’ve configured our tenant in this way.” A given organization might have many tenants,
and when this is the case, the name of core domain of the tenant is usually used to remove any ambiguity. 
The name of the core domain comes in the form *.onmicrosoft.com, where the * varies. A tenant may have many 
subscriptions, exactly one directory, and one or more domains associated with it.

# Azure Subscription

When you sign up, an Azure subscription is created by default. An Azure subscription is a logical container 
used to provision resources in Azure. It holds the details of all your resources like virtual machines (VMs), 
databases, and more. When you create an Azure resource like a VM, you identify the subscription it belongs to. 
As you use the VM, the usage of the VM is aggregated and billed monthly.
