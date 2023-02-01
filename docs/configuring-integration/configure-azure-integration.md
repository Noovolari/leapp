---
title: "Configure an Azure integration"
description: "Our Leapp integration refers to Azure Tenant which is a dedicated and trusted instance of Azure AD."
pageType: "integration"
structured_data_how_to_title: "Configure an Azure integration"
structured_data_how_to_tip1: "Click on the _Add integration_ button in the sidebar"
structured_data_how_to_tip2: "Select Azure as _Integration type_"
structured_data_how_to_tip3: "Provide the required information (described in the next section)"
structured_data_how_to_tip4: "Click on the _Add integration_ button"
social_title: "Configure an Azure integration"
social_description: "Our Leapp integration refers to Azure Tenant which is a dedicated and trusted instance of Azure AD."
social_relative_image_path: "azure.png"
sitemap_video_title: "Configure an Azure integration"
sitemap_video_content: "newuxui/azure-integration.mp4"
---

## What is an Azure integration

Our Leapp integration refers to Azure Tenant which is a dedicated and trusted instance of Azure AD.

The tenant is automatically created when your organization signs up for a Microsoft cloud service subscription.

These subscriptions include Microsoft Azure, Microsoft Intune, or Microsoft 365. 

An Azure tenant represents a single organization and can have multiple subscriptions.

Please refer to [How to find your Azure Active Directory tenant ID](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-how-to-find-tenant){: target='_blank'} and other [Azure AD documentation](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-whatis){: target='_blank'} for more information.

!!! Warning

    For azure-cli users with version < 2.30.0: Leapp no more support this version of the CLI. Please update to a newer version.

To create a new Azure Integration go to the left sidebar of Leapp Desktop and click on the "+" icon. 
A new modal will be presented with the following option to compile. After submitting the new Integration 
and have logged into your *Azure Portal*, 
*Subscriptions* will be automatically retrieved and mapped into Leapp Azure Sessions.

## How to configure an Azure integration in Leapp

1. "Click on the _Add integration_ button in the sidebar"
2. "Select Azure as _Integration type_"
3. "Provide the required information (described in the next section)"
4. "Click on the _Add integration_ button"

## Required information

| Field              | Description                                                                                                                                                                                                                                                                                        |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `INTEGRATION TYPE` | Set as *Azure*                                                                                                                                                                                                                                                                                     |
| `ALIAS`            | Your friendly integration name in Leapp. Give it a meaningful name so it will be easier to find inside Leapp.                                                                                                                                                                                      |
| `TENANT ID`        | A [**tenant ID**](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-how-to-find-tenant){: target='_blank'} identifies a tenant. You can have multiple clients on a given tenant database.                                                                                                                                                                                                     |
| `LOCATION`         | The Azure datacenters are located around the world in strategic places that best meet the customer demands. These areas are known as Azure locations. Specific services requires the user to select a specific location. The value is retrieved from your *default location* in *general options*. |


![](../../images/screens/newuxui/azure-tenant.png?style=center-img "Add Azure Integration Screen")

## Video tutorial

<video width="100%" muted autoplay loop> <source src="../../videos/newuxui/azure-integration.mp4" type="video/mp4"> </video>

!!! info

    Azure sessions are not available anymore for direct creation. Instead you can create a new [Azure Integration](../configuring-integration/configure-azure-integration.md).
