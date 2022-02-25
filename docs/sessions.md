# Sessions

A **Session** contains all the relevant information to let the dev connect to a cloud provider. Three standard actions should be implemented for each session: **start**, **stop**, and **rotate**.


## Actions

| Method      | Description                          |
| ----------- | ------------------------------------ |
| `START`     | :fontawesome-solid-play:    &nbsp;Make the temporary credentials available to the provider chain  |
| `STOP`      | :fontawesome-solid-stop:    &nbsp;Removes the temporary credentials from the provider chain |
| `ROTATE`    | :fontawesome-solid-undo:    &nbsp;Generate new temporary credentials, and substitute the previous ones in the provider chain |


The process of setting up Leapp Sessions is managed either **manually**, for each access method, or through **integrations** with third-party tools. Leapp stores all the Sessions available to the users locally, inside a configuration file called **Workspace.**
