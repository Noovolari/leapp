Leapp manages 4 types of AWS access methods:

1. IAM Federated Role
2. IAM User
3. IAM Single Sign-On
4. IAM Role chained

For each access method Leapp **generates** through [STS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html) a set of ```temporary credentials``` and a **rotation** logic is triggered every **20 minutes**.

Temporary credentials **ensures that no long-term credentials are written in the AWS credentials file** located in ```~/.aws/credentials```.

Leapp manages information inserted by the user using the following logic for each access method.

## IAM Federated Role

### assumeRoleWithSAML

Temporary security credentials created by [AssumeRoleWithSAMLResponse](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithSAML.html) **last for one hour**. 
However, you can use the optional *DurationSeconds* parameter to specify the duration of your session. 

Your role session lasts for the specified duration, or until the time specified in the SAML authentication response's *SessionNotOnOrAfter* value, whichever is shorter. You can provide a DurationSeconds value from **900 seconds** (15 minutes) up to the **maximum session duration setting for the role**. This setting can have a value **from 1 hour to 12 hours**.

**Leapp sets the token duration to 1 hour.**

!!! Info

    ⚠️ In this case, generated credentials are not "cached" in the keychain.


## IAM Chained Role

A IAM Chained Role is used to access another AWS account services through a main session with a trust relationship.

[https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#assumeRole-property](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#assumeRole-property)

[https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html)

**If you do not pass DurationSeconds parameter (this is Leapp's case), the temporary credentials expire in 1 hour.**

## IAM User

The *GetSessionToken* operation must be called by using the **long-term AWS security credentials** of the AWS IAM user, which . Credentials that are created by **IAM users are valid for the duration that you specify**. This duration can range from **900 seconds** (15 minutes) up to a **maximum of 129,600 seconds (36 hours)**, with a **default of 43,200 seconds (12 hours)**. Credentials based on **account credentials** can range **from 900 seconds (15 minutes)** up to **3,600 seconds (1 hour)**, with a default of **1 hour**.

**Leapp sets the token duration to 10 hours.**

!!! Info

    These are the only temporary credentials that are stored in the System vault and not rotated, unless expired.

## AWS SSO Role

[https://aws.amazon.com/premiumsupport/knowledge-center/sso-temporary-credentials/](https://aws.amazon.com/premiumsupport/knowledge-center/sso-temporary-credentials/)

!!! Info

    The access token is valid for 8 hours as noted in the expiresAt timestamp in the JSON file. Expired tokens must re-authenticate using the get-role-credentials API call.

**Token duration is fixed to 8 hours.**
