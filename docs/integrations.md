This section provides an overview of Leapp's integrations, useful to extend the functionality of Leapp to 3rd party services.

Integrations help manage access and identities on your preferred service of choice and use Leapp on your daily activities by automatically mapping them into [Sessions](/0.9.0/sessions).

Integrations help manage access and identities on your service of choice while using Leapp during your daily activities. They are automatically mapped into [Sessions](/0.9.0/sessions).

## Actions

Integrations have four main actions available: **Create**, **Delete**, **Sync**, and **Logout**.

| Action    | Description |
| --------- | ----------- |
| `CREATE`  | **Configure a new Integration with the data needed to start the authentication flow.** Required to Sync and map the service response into Sessions. |
| `DELETE`  | **Remove an existing Integration.** Removes all the associated Sessions as well and wipes everything related to the Integration from the system (tokens, cache, etc.) |
| `SYNC`    | **Start the authentication flow to log into the Integration Provider.** Leapp will automatically retrieve all the related data and map the response into Sessions. Any change in your service of choice requires a manual Sync to reflect the current status. |
| `LOGOUT`  | **Disable the Integration.** Removes all the Sessions but keeps the Integration data. Running a Sync will restore all the Sessions tied to it. |

## Supported Services

| Service     | Supported |
| ----------- | --------- |
| AWS SSO     | :fontawesome-solid-check: |
| Okta        | Coming Soon |
| OneLogin    | Coming Soon |
| AzureAD     | Coming Soon |
