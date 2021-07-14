# AWS Named Profiles

Named Profiles are a way AWS uses to maintain more than one set of credentials active for you to use with AWS-CLI, SDK, or other third-party tools. Named profiles are stored in ~/.aws/credentials file in the [ini file format](https://en.wikipedia.org/wiki/INI_file).

Named Profiles have a *default* one which is the one you get from **aws configure** command.

Leapp can, from release [0.4.7](https://github.com/Noovolari/leapp/releases/tag/v0.4.7), manage more than one profile, to allow users to have multiple credentials set at the same time.

Named Profiles are selectable directly when creating an AWS access method ([IAM Federated Role](../use-cases/aws_iam_role.md), [IAM Chained Role](../use-cases/aws_iam_role.md), [IAM User](../use-cases/aws_iam_user.md)), by using the selector provided in the form.

![](../images/contributing/aws_named_profiles/AWS_NAMED_PROFILES_1.png)

It is also possible to create a new *named profile* directly from the selector **by typing a new name and by pressing ENTER key**.

![](../images/contributing/aws_named_profiles/AWS_NAMED_PROFILES_2.png)

The new name is directly added to the *named profile list* and it will be possible to use it for other sessions too.

**AWS SSO** sessions will have *default* as named profile when obtained through Login or Sync, to change the named profile associated to a session you have to use the "Change Profile" option in the session list.

## Named Profile List

Named profiles can be managed from the **option** page.

![](../images/contributing/aws_named_profiles/AWS_NAMED_PROFILES_3.png)

Here you can *add* or *edit* a new named profile, you can also *remove* unwanted named profiles. When removing a named profile, Leapp will give you a hint on modified sessions, and those sessions will be reverted to **default** named profile.

The input form can be used for *adding* or *editing* a named profile: when empty you can use it to **add** a new named profile. When selecting the ![](../images/contributing/aws_named_profiles/AWS_NAMED_PROFILES_4.png) (edit) button, the input field will be filled and you can change the name of the named profile associated **with all sessions** already linked to that profile.

## Session Options

A named profile can also be changed directly from an AWS session element in the *main list*.

![](../images/contributing/aws_named_profiles/AWS_NAMED_PROFILES_5.png)

There you can add or select a new named profile the same way you would from the *add session form*.

Remember that when you change a session's profile the session is put immediately in stop mode, that's because we have changed the credential file, so you'll need to restart it again.
