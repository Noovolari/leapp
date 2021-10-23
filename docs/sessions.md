# Session

A **Session** contains all the relevant information to let the dev connect to a cloud provider.

Three standard actions should be implemented for each session: **start**, **stop**, and **rotate**.

## Actions

| Method      | Description                          |
| ----------- | ------------------------------------ |
| `START`       | :fontawesome-solid-play:    Make the temporary credentials available to the provider chain  |
| `STOP`       | :fontawesome-solid-stop: Removes the temporary credentials from the provider chain |
| `ROTATE`    | :fontawesome-solid-undo:     Generate new temporary credentials, and substitute the previous ones in the provider chain |


## Data
All Sessions shares some basic data, common to all.

### ID
Unique identifier to the Session

### sessionName
A fancy name for the Session to make it recognizable to the user.

### status
Represent the **State Management** of a single session; when the **status** of a session is **`ACTIVE`,** temporary credentials are available to the user.

### startDateTime
A UTC DateTime string representing the last time a specific Session has started; this is useful for rotation and sorting purposes.

### region
The AWS region or Azure Location the Session is working on.

### type
Uniquely identifies two central aspects to determine the Session: **Cloud Provider** and **Access Method.**

## Access Method

**Type** identifies two central aspects to determine the Session: **Cloud Provider** and **Access Method.**

The naming convention we are using is `cloudProvider-accessMethod`.

- the **Cloud Provider** on which you are connecting (i.e., AWS, Azure, GCP...)
- the **Access Method** used to generate credentials (i.e., AWS IAM User, Azure Tenant, AWS IAM Role...)

The process of setting up Leapp Sessions is managed either **manually**, for each access method, or through **integrations** with third-party tools.

Leapp stores all the Sessions available to the users locally, inside a configuration file called **Workspace.**

``` python
import tensorflow as tf
```

- [x] Lorem ipsum dolor sit amet, consectetur adipiscing elit
- [ ] Vestibulum convallis sit amet nisi a tincidunt
  * [x] In hac habitasse platea dictumst
  * [x] In scelerisque nibh non dolor mollis congue sed et metus
  * [ ] Praesent sed risus massa
- [ ] Aenean pretium efficitur erat, donec pharetra, ligula non scelerisque


``` python hl_lines="2-5"
def bubble_sort(items):
    for i in range(len(items)):
        for j in range(len(items) - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
```



??? note

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod
    nulla. Curabitur feugiat, tortor non consequat finibus, justo purus auctor
    massa, nec semper lorem quam in massa.
