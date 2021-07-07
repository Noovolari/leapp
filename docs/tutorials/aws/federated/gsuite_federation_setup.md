# How to set up G Suite federation

Let’s start with G Suite & AWS federation:

## 1. Log in to your Google Admin Console and click on the user button as shown in figure:

<img width="753" alt="Screenshot 2021-04-13 at 10 59 24" src="https://user-images.githubusercontent.com/9497292/114526633-784f3500-9c47-11eb-8fd5-148db762fcf9.png">

## 2. Create a new category of custom attributes

### a. Click *Manage Custom Attributes*

In the G Suite directory, once in *Users* screen, select *More* from the top menu. Then select “**Manage Custom Attributes”.**

<img width="1511" alt="Screenshot 2021-04-13 at 10 59 03" src="https://user-images.githubusercontent.com/9497292/114526659-7c7b5280-9c47-11eb-9153-7465ceb4fbd4.png">

### b. Choose “Add Custom Attribute”

In the top-right corner of the page click on “Add Custom Attribute”.

![addcustomattribute](images/G_SUITE_FEDERATION_SETUP-3.png)

### c. Fill the Form

Fill the form like in the figure below:

<img width="1120" alt="Screenshot 2021-04-13 at 11 07 40" src="https://user-images.githubusercontent.com/9497292/114527726-96696500-9c48-11eb-8f94-f9448a630d5d.png">

## 3. Create a SAML-Based application

In order to set up a SAML-Based Single Sign-On, we first need to create a custom application representing AWS.

### a. Return to main page and browse to the "Apps" section
![table1](images/G_SUITE_FEDERATION_SETUP-6.png)

### b. Add a new SAML application
![table1](images/G_SUITE_FEDERATION_SETUP-7.png)

### Select Amazon Web Services template

Click on the “Add apps” selector in the menu bar, then "Search app" like in figure:

<img width="958" alt="Screenshot 2021-04-13 at 11 27 27" src="https://user-images.githubusercontent.com/9497292/114530726-80a96f00-9c4b-11eb-859d-836632ee3ffa.png">

Then Search for "Amazon Web Services", wait for search to complete then select the one in figure, being careful to check that is a "Web SAML":

<img width="1630" alt="Screenshot 2021-04-13 at 11 14 17" src="https://user-images.githubusercontent.com/9497292/114530775-8ef78b00-9c4b-11eb-922d-b79e3e283968.png">

### Save the IDP Metadata file
The IDP Metadata is a .xml file containing configuration parameters and the X509 certificate. It enables the trust relationship between Identity and Service Provider. Save it; we will use it in a later step.

> :warning: **The metadata file must be kept secret and securely stored **: the security of the solution relies on its secrecy.

<img width="1037" alt="Screenshot 2021-04-13 at 11 32 30" src="https://user-images.githubusercontent.com/9497292/114531557-4b515100-9c4c-11eb-8712-c644a5524dd4.png">

### Choose the Service Provider’s details id
Under **Service Provider Details**, select **EMAIL** choosing from the **Name ID Format** drop-down like in figure, leave the rest as it is.

<img width="1033" alt="Screenshot 2021-04-13 at 11 36 33" src="https://user-images.githubusercontent.com/9497292/114531845-8c496580-9c4c-11eb-9191-7cd5969c1d7f.png">

### Add the attribute Mapping
The attributes previously created are associated and mapped to the **SAML assertion**. The first 2 are predefined by Google, set the following mapping with the help of the figure:

- [https://aws.amazon.com/SAML/Attributes/RoleSessionName](https://aws.amazon.com/SAML/Attributes/RoleSessionName) -> Basic Information -> Primary Email
- [https://aws.amazon.com/SAML/Attributes/Role](https://aws.amazon.com/SAML/Attributes/Role) -> AWS_SAML -> IAM_Role

Add another mapping and set it like this:
- [https://aws.amazon.com/SAML/Attributes/SessionDuration](https://aws.amazon.com/SAML/Attributes/SessionDuration) -> AWS_SAML -> SessionDuration

This is the final setup:

<img width="1030" alt="Screenshot 2021-04-13 at 11 41 39" src="https://user-images.githubusercontent.com/9497292/114532911-9a4bb600-9c4d-11eb-8ec9-b7bae228dfa6.png">

## 4. Enable the SAML App

### a. Turn ON the App

Go back to the **SAML app menu list (from the Admin Panel, select “Apps”) and select the Amazon Web Services line:

<img width="833" alt="Screenshot 2021-04-13 at 11 46 20" src="https://user-images.githubusercontent.com/9497292/114534017-d6334b00-9c4e-11eb-8d2b-85fdad77996f.png">

Go to the user panel like in the figure and click on the down chevron icon:

<img width="1549" alt="Screenshot 2021-04-13 at 11 47 11" src="https://user-images.githubusercontent.com/9497292/114534183-00850880-9c4f-11eb-8e51-c30a00f3c88a.png">

Once in the panel click on **"ON for everyone"** and press save.

<img width="1161" alt="Screenshot 2021-04-13 at 11 46 45" src="https://user-images.githubusercontent.com/9497292/114534224-0bd83400-9c4f-11eb-8644-4c7ca84c34ec.png">

Now you’ve added the Amazon Web Service application to your App Google menu.

### b. Get the SAML App link
Click on your App Google menu, locate the new entry, and right-click on it to copy its value. We will need this in the next tutorial.

Congratulations, the first phase of the federation is complete, follow up with the next tutorial to set up the federation on AWS side.
