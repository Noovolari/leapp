# Workspaces

A **Workspace** is a global configuration that contains all the relevant information about your Leapp setup (sessions, integrations, app preferences, etc.).

There are two types of workspace: **Local** and **Remote**.

## Local

A **Local workspace** is the **default** workspace that comes with your Leapp installation. It's a private configuration that contains your personal
preferences and **all sessions and integrations that you created yourself**. 

A local workspace is associated to a **single machine** and if you need to migrate your configuration to another one you will have to do it
manually. 

Alternatively, you can use **Remote workspaces**.

## Remote

A **Remote workspace** is a **[Leapp Team](https://www.leapp.cloud/team)** configuration set **created remotely by a Leapp Team manager**. 

When you **sync** a remote workspace, you will receive sessions and integrations **automatically**, without having to configure them yourself. 

A remote workspace is **persisted online** by using **[Zero-Knowledge encryption](https://docs.leapp.cloud/latest/security/zero-knowledge/)**.

You will have access to the same configurations **instantly** on any machine, by logging in to your Leapp Team account after having been invited by your Leapp Team manager.

!!! Info
    Both your local and remote workspaces are saved on your machine as encrypted files inside your <home>/.Leapp directory.

## Actions

The actions below only applies to Remote workspaces.

| Action     | Description                                                                                                       |
|------------|-------------------------------------------------------------------------------------------------------------------|
| `Sign-in`  | :fontawesome-solid-sign-in: &nbsp;Connect to a Remote workspace. This action will not switch your Local workspace |
| `Switch`   | :fontawesome-solid-check: &nbsp;Switch to the selected workspace by clicking on its name in the workspace menu    |
| `Lock`     | :fontawesome-solid-lock-alt: &nbsp;Switch back to the Local workspace disabling all the Remote ones               |
| `Sign-out` | :fontawesome-solid-sign-out: &nbsp;Sign-out from a Remote workspace removing all your login details               |


!!! Info
    The Lock action also removes the encrypted files associated to your remote workspaces.
