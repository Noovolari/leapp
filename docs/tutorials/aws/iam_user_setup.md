# How to create a IAM User Access Method for AWS

If this is your first time accessing Leapp please follow this [guide](https://github.com/Noovolari/leapp/wiki/first-access).

1) From your quick list click on the "+" button located on the top-right corner of the app

You'll be presented with the **Provider Selection** screen:

<img width="512" alt="Screenshot 2021-04-12 at 14 23 00" src="https://user-images.githubusercontent.com/9497292/114393749-ac205100-9b9a-11eb-94a2-726377d6023b.png">

2) Choose "**AWS**" as a Cloud Provider, than you'll be presented with the **Access Strategy** selection screen:

<img width="514" alt="Screenshot 2021-06-28 at 18 03 55" src="https://user-images.githubusercontent.com/9497292/123668406-5d01c800-d83b-11eb-8e51-d51ac72e806c.png">

Select "**IAM User**" as the Access Strategy.

3) As the last screen you'll be presented with the actual account creation screen:

<img width="513" alt="Screenshot 2021-06-28 at 18 06 18" src="https://user-images.githubusercontent.com/9497292/123668629-94707480-d83b-11eb-8dd2-0a12739b4362.png">

- **Session Alias:** choose a unique name suitable to recognize the Access Method.
- **MFA Device**: Get it from your IAM User if any: check for its **role ARN** or if from a physical device its **serial number**.

- **Region**: The AWS Region you want your credentials to work on.
- **Access Key / Secret Key:** get the credentials from your IAM User.

Here you can also set a new MFA device by clicking on "Manage" in the AWS console at the voice *Assigned MFA device*. **IF** an MFA **arn** is inserted in the form field, then Leapp will ask for MFA token before trying to generate temporary credentials. Please also refer to this section about [limits](https://github.com/Noovolari/leapp/wiki/Limited-role-permissions-for-AWS-plain-account) in the plain account.

Finally press **Save**.
