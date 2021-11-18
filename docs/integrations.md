This section provides an overview of Leapp's integrations, useful to extend the functionality of Leapp to 3rd party services.

Integrations help manage access and identities on your preferred service of choice and use Leapp on your daily activities by automatically mapping them into [Sessions](/sessions).

## Actions

Integrations have four main actions available: **Create** **Delete**, **Sync**, and **Logout**.

| Action    | Description |
| --------- | ----------- |
| `CREATE`  | Configure a new Integration with the data needed to start the authentication flow and map the response into Sessions. |
| `DELETE`  | Remove an existing Integration. Also removes all the associated Sessions and wipes from the system everything related to it (Sessions, tokens, cache, etc.) |
| `SYNC`    | Start the authentication flow to log into the Integration Provider. Leapp will automatically retrieve all the related data and map the response into Sessions. Changes in your service of choice, need to manually Sync again to reflect the current status. |
| `LOGOUT`  | Disable the Integration without removing it and removes all the Sessions. Running a Sync will restore them. |

## Supported Services

| Service     | Supported |
| ----------- | --------- |
| AWS SSO     |  |
| Okta        |  |
| OneLogin    |  |
| AzureAD     |  |
