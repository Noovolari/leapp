# How to create a Truster Account from a Federated Account for AWS with Leapp

> **NOTE**: to create a chained session you either need a Federated, Plain, or SSO session first.


If this is your first time accessing Leapp please follow this [guide](https://github.com/Noovolari/leapp/wiki/FIRST_SETUP.md).

<br/>

#### 1. From your quick list click on the "+" button located on the top-right corner of the app

<br/>

You'll be presented with the **Provider Selection** screen:

<img width="515" alt="1" src="https://user-images.githubusercontent.com/9497292/123774017-56bc2c00-d8cd-11eb-906e-2f1e7753d234.png">

<br/>
<br/>

#### 2. Choose "**AWS**" as a Cloud Provider, then you'll be presented with the **Access Method** selection screen:

<img width="514" alt="2" src="https://user-images.githubusercontent.com/9497292/123774140-6c315600-d8cd-11eb-874d-16f0c9ead867.png">

<br/>

Select "**IAM Chained Role**" as the Access Strategy.

<br/>

#### 3. As the last screen you'll be presented with the actual account creation screen:

<img width="513" alt="Screenshot 2021-06-29 at 11 31 28" src="https://user-images.githubusercontent.com/9497292/123774316-94b95000-d8cd-11eb-87ac-22feb256f962.png">

<br/>

- **AWS Profile**: here you can select (ora add by writing and pressing ENTER) a named profile to use for this credential set, base one is "default"
- **Session Alias:** choose a unique name suitable to recognize the Access Method.
- **Region**: the region to start this credential set into once the section is active. You can always add a default one from option panel
- **Role ARN**: Write the role ARN of the chained role you want to assume inside your AWS Account.
- **Assumer Session**: any eligible session that you can use to start your chained session.

<br/>     

Finally press **Save**.
