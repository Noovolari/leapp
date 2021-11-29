## Azure credentials generation

Azure generates a set of access and refresh tokens that are put inside accessTokens.json inside .azure directory. 
Following is the procedure used to generate a set of credentials.

### Access strategy - start session

if accessTokens.json is not present Leapp runs `az login —tenant <tenant_id> 2>&1`, otherwise accessTokens.json file 
is parsed and Leapp extracts the access tokens array.

if access token - corresponding to the specific tenant - exists, we extract it or else we run `az login`.

if access token is expired we run `az account get-access-token --subscription <subscription-id>`.

Finally `az account set —subscription <subscription-id> 2>&1` and `az configure —default location <region(location)>` are run.

Refresh token is deleted from the accessTokens.json file

### Access strategy - rotate session

- same as start session

### Access strategy - stop session

We run `az account clear`, and we set session's status to INACTIVE.
  
!!! info

    Leapp enhances security by forcingly refresh access token every 20 minutes and by removing refresh token from the file.
