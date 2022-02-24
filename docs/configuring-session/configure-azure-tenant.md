A dedicated and trusted instance of Azure AD that's automatically created when your organization signs up for a Microsoft cloud service subscription, such as Microsoft Azure, Microsoft Intune, or Microsoft 365. An Azure tenant represents a single organization.

An Azure Tenant consists of a name and a set of long-term credentials. 

!!! Info

    For azure-cli version < 2.30.0: Leapp enhances security of Azure credentials by removing *refresh token* from the accessTokens.json file 
    which could potentially allow an attacker accessing a User's PC to regenerate valid credentials even 
    if a valid access token is not present and by **rotating** Azure access token.

## Fields

| Field             | Description                          |
|-------------------| ------------------------------------ |
| `SESSION ALIAS`   | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to find inside Leapp. |
| `TENANT ID`       | A **tenant ID** identifies a tenant. You can have multiple clients on a given tenant database. |
| `SUBSCRIPTION ID` | The **subscription ID** is a unique alphanumeric string that identifies your Azure subscription. |
| `LOCATION`        | The Azure datacenters are located around the world in strategic places that best meet the customer demands. These areas are known as Azure locations. Specific services requires the user to select a specific location.|


![](../../images/screens/newuxui/azure-tenant.png?style=center-img "Add Azure Tenant Screen")
## Video Tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/azure.mp4" type="video/mp4"> </video>
