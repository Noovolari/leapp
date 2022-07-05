## Azure credentials generation

Azure generates a set of access and refresh tokens that are put inside **msal_token_cache.json** inside **.azure** directory. 
Following is the procedure used to generate a set of credentials.

!!! info
    
    In Windows OS the msal_token_cache is persisted on an encrypted file with [**dpapi**](https://docs.microsoft.com/en-us/previous-versions/ms995355(v%3Dmsdn.10)) API.<br>
    [Starting from release 2.30](https://docs.microsoft.com/en-us/cli/azure/msal-based-azure-cli) of Azure CLI, credentials are no more persisted in the original accessToken.json

Azure Users profile info is saved in the **azureProfile.json** file inside the **.azure** directory.

### Access strategy - login integration

Before accessing Azure sessions you now have to [create](../../configuring-integration/configure-azure-integration.md) an Azure integration.
After that, these are the steps required to login and then retrieve Azure sessions.

1. *msal_token_cache* and *azureProfile.json* files are cleaned for security reason.
2. We execute `az login --tenantId <TENANTID>`. We do this to obtain the updated user profile and the refresh token (associated to this integration).
3. We extract all the Azure subscriptions associated with the integration and for each one we map a Leapp Azure session.
4. We extract the *refresh token*, *account*, and *profile* information from *msal_token_cache and azureProfile.json* and persist them in the [System's vault](../system-vault.md).
5. We also remove the previous information from the original files, to increase security and avoid external tampering.

### Access strategy - start session

!!! info

    In the current version of Leapp we can only start one Azure session at a time.

For each subscription retrieved upon login to a specific integration, we define a new Leapp Azure Session.
To start an Azure session we follow these steps.

1. Recover *refresh token*, *account*, and *profile* information from the Vault and we use them alongside sessionId (Subscription id) in the start operation.
2. *azureProfile.json* is only filled with profile information from the current subscription.
3. We write the *account information* and the *refresh token* back in the *msal_token_cache*
4. We execute `az account get-access-token --subscriptionId <SUBSCRIPTIONID>`, to retrieve the **access token** and the **id token** of the subscription.
5. The previous command also write *access* and *id token* back to the *msal_token_cache file*.
6. We update the *expiration time* of the session to the current datetime.
7. We update the *refresh token* in the Vault with the new information.
8. We remove the *refresh token* from the *msal_token_cache*.
9. We finally start the session.

!!! info

    - The **refresh token** is a long term credential that potentially lasts for **90 days**. The **access token** is a short term credential and last for **70 minutes**. [Source](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens)

### Access strategy - rotate session

To rotate the session's credentials we do the following steps:

1. We obtain the **expiration time** from the session we are rotating.
2. We check with the *current date* to see if the session validity will expire in the next **20 minutes**.
3. If **no**, no other checks are necessary you can still use the current credentials.
4. If **yes**, we do the following operations:


    - Remove *access token* from **msal_token_cache**.
    - Recover *refresh token* from System's Vault.
    - Insert the *refresh token* back into the *msal_token_cache* file.
    - We redo the last 4 steps (6-9) from the *start operation*.

### Access strategy - stop session

To stop the session (because we only have one active at a time) we do the following steps:

1. We run `az logout`, and we set session's status to INACTIVE. This operation cleans both *msal_token_cache* and *azureProfile.json* files.
  
!!! info

    Leapp enhances security by forcingly refresh access token every 20 minutes and by removing refresh token from the msal_token_cache.
