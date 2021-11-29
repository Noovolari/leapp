A dedicated and trusted instance of Azure AD that's automatically created when your organization signs up for a Microsoft cloud service subscription, such as Microsoft Azure, Microsoft Intune, or Microsoft 365. An Azure tenant represents a single organization.

An Azure Tenant consists of a name and a set of long-term credentials. 

!!! Info

    Leapp enhances security of Azure credentials by removing *refresh token* from accessTokens.json file 
    which could potentially allow an attacker accessing a User's PC to regenerate valid credentials even 
    if a valid access token is not present and by **rotating** Azure access token.

## Fields

| Field                      | Description                          |
| ---------------------------| ------------------------------------ |
| `ALIAS`                    | Your friendly session name in Leapp. Give it a meaningful name so it will be easier to search for it inside Leapp. |
| `TENANT ID`                | A **tenant ID** identifies a tenant. You can have multiple clients on a given tenant database. |
| `SUBSCRIPTION ID`          | The **subscription ID** is a unique alphanumeric string that identifies your Azure subscription. |
| `LOCATION`                 | The Azure datacenters are located around the world in strategic places that best meets the customer demands. These areas are known as Azure locations. Specific services requires the user to select a specific location.|



![](../../images/screens/azure-tenant.png?style=center-img "Add Azure Tenant Screen")

## Video Tutorial

![](../../videos/Azure.gif?style=center-img)
