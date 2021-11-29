This section provides an overview of Leapp's integrations, useful to extend the functionality of Leapp to 3rd party services.

Integrations help manage access and identities on your preferred service of choice and use Leapp on your daily activities by automatically mapping them into [Sessions](/sessions).

## Actions

Integrations have four main actions available: **Create** **Delete**, **Sync**, and **Logout**.

| Action    | Description |
| --------- | ----------- |
| `CREATE`  | **Configure a new Integration with the data needed to start the authentication flow.** Required to Sync and map the service response into Sessions. |
| `DELETE`  | **Remove an existing Integration.** Also removes all the associated Sessions and wipes from the system everything related to it (Sessions, tokens, cache, etc.) |
| `SYNC`    | **Start the authentication flow to log into the Integration Provider.** Leapp will automatically retrieve all the related data and map the response into Sessions. Any change in your service of choice, require a manual Sync to reflect the current status. |
| `LOGOUT`  | **Disable the Integration.** Removes all the Sessions but keep the Integration data. Running a Sync will restore all Sessions tied to it. |

## Supported Services

| Service     | Supported |
| ----------- | --------- |
| AWS SSO     | :fontawesome-solid-check: |
| Okta        | Coming Soon |
| OneLogin    | Coming Soon |
| AzureAD     | Coming Soon |
