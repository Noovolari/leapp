# Assign the role to G Suite Principal
This tutorial explains how to federate a Role with existing G Suite Users.

## 1. Access your G Suite admin console
Move to the **Users** section;

![](../../../images/tutorials/AWS/IAM_FEDERATED_ROLE/ASSIGN_ROLE_TO_GSUITE_PRINCIPAL-1.png)

## 2. Select the user
Select the user you to want to enable SSO access to AWS and click on **User Information**

## 3. Edit AWS SAML Information.
In the IAM_Role field, insert the role Role ARN and IDP ARN separated with a comma and without spaces. Insert 28800 (seconds) in the SessionDuration field.

<img width="1162" alt="Screenshot 2021-04-13 at 10 36 42" src="https://user-images.githubusercontent.com/9497292/114523675-c9115e80-9c44-11eb-8470-200c4055807d.png">


![](../../../images/tutorials/AWS/IAM_FEDERATED_ROLE/ASSIGN_ROLE_TO_GSUITE_PRINCIPAL-2.png)
![](../../../images/tutorials/AWS/IAM_FEDERATED_ROLE/ASSIGN_ROLE_TO_GSUITE_PRINCIPAL-3.png)

You successfully assigned a role to User.
Now the user can log in to the federated AWS account using its corporate identity.
