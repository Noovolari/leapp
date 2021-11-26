Leapp gives a User the ability to group and activate more than one credential set at a time with **Named Profiles**.

## Named Profiles

Named Profiles are a way AWS uses to maintain more than one set of credentials active for you to use with AWS-CLI, SDK, or other third-party tools. Named profiles are stored in *~/.aws/credentials* file in the **ini** file format.

Named Profiles have a default profile which is the one you get from [aws configure](https://docs.aws.amazon.com/cli/latest/reference/configure/) command.

## Create a new Named Profile

Named Profiles can be created in **3 ways**:

=== "Option Panel"

    Click on the hamburger icon and go to **Options**. 
    Find the **Named profiles** tab, and click on the plus icon.

=== "When creating a new Session"

    When creating a new session a selector will be available to choose or **add** a new profile.

=== "Edit Profile in Contextual Menu"

    Click on the kebab icon and select **edit profile** an option to select or add a new profile will be available.


!!! info

    Named Profiles are selectable directly when creating an AWS access method (IAM Federated Role, 
    IAM Chained Role, IAM User or IAM SSO Role), by using the selector provided in the form.

It is also possible to create a new named profile directly from the selector by typing a new name and by pressing ENTER key.


The new name is directly added to the named profile list and it will be possible to use it for other sessions too.

AWS SSO sessions will have default as named profile when obtained through Login or Sync, to change the named profile associated to a session you have to use the "Change Profile" option in the session list.

Named Profile List
Named profiles can be managed from the option page.


Here you can add or edit a new named profile, you can also remove unwanted named profiles. When removing a named profile, Leapp will give you a hint on modified sessions, and those sessions will be reverted to default named profile.

The input form can be used for adding or editing a named profile: when empty you can use it to add a new named profile. When selecting the


(edit) button, the input field will be filled and you can change the name of the named profile associated with all sessions already linked to that profile.
Session Options
A named profile can also be changed directly from an AWS session element in the main list.


There you can add or select a new named profile the same way you would from the add session form.

Remember that when you change a session's profile the session is put immediately in stop mode, that's because we have changed the credential file, so you'll need to restart it again.
