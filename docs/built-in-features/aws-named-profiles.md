With Leapp you can group and activate more than one credential set at a time through [Named Profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

## Named Profiles

Named Profiles are used by AWS to maintain more than one set of active credentials for you to use with AWS-CLI, SDK, or other third-party tools. Named profiles are stored in *~/.aws/credentials* file in the **ini** file format.

Named Profiles have a default profile which is the one you get from [aws configure](https://docs.aws.amazon.com/cli/latest/reference/configure/) command.

## Create a new Named Profile

Named Profiles can be created in **3 ways**:

=== "Option Panel"

    Click on the gear icon <img width="24" alt="Screenshot 2022-02-03 at 15 22 34" src="https://user-images.githubusercontent.com/9497292/152361141-75b5edec-f68f-47af-9a72-fd189706cb2a.png"> 
    and select the **Profiles** tab. Insert the name of the new Named Profile in the input form, then click on the plus icon.

=== "When creating a new Session"

    When creating a new session, the user will have the option to choose a Named Profile or **add** a new one.

=== "Edit Profile in Contextual Menu"

    Right-click on a session and select **Change** then **Named Profile**: an option to select or add a new Named Profile will be available.
    <br><br>  
    <img width="560" alt="Screenshot 2022-02-03 at 15 25 43" src="https://user-images.githubusercontent.com/9497292/152361872-0f52d40b-7c02-4dce-999c-c1bd2db517af.png">


The new name is directly added to the Named Profile list and can then be used for other sessions too.

!!! Info

    AWS SSO sessions will have the Named Profile ```default``` when obtained via Login or Sync. To change the Named Profile associated to a session you have to use the "Change Profile" option in the session list.

##Named Profile List

Named profiles can be managed from the Option menu.


In the Option menu, under the Profiles tab, you can add or edit a new Named Profile, and you can also remove unwanted ones. When removing a Named Profile, Leapp will warn you about which sessions are using that profile, and those sessions will be reverted to the default Named Profile.

The input form can be used to add or edit a Named Profile: if it's empty, you can use it to add a new named profile. When selecting the <img width="32" alt="Screenshot 2022-02-03 at 15 32 11" src="https://user-images.githubusercontent.com/9497292/152363026-6b933ce9-6ad1-4ae6-a6db-eefa5769764e.png"> button, you will be able to edit the name of the Named Profile from within the input form.

!!! Warning
    Remember that when you change the profile of a session, the session will be immediately put in stop mode. That's because Leapp would have to change the credential file, so you will need to restart the session again.
