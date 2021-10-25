# Session

A **Session** contains all the relevant information to let the dev connect to a cloud provider.

Three standard actions should be implemented for each session: **start**, **stop**, and **rotate**.

## Actions

| Method      | Description                          |
| ----------- | ------------------------------------ |
| `START`     | :fontawesome-solid-play:    &nbsp;Make the temporary credentials available to the provider chain  |
| `STOP`      | :fontawesome-solid-stop:    &nbsp;Removes the temporary credentials from the provider chain |
| `ROTATE`    | :fontawesome-solid-undo:    &nbsp;Generate new temporary credentials, and substitute the previous ones in the provider chain |


## Session Model Data
All Sessions Models shares some basic information, common to all of them. These variables must be defined all the time.

``` javascript
...
export class Session {

  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  startDateTime: string;
  region: string;
  type: SessionType;

  constructor(sessionName: string, region: string) {
    this.sessionId = uuid.v4();
    this.sessionName = sessionName;
    this.status = SessionStatus.inactive;
    this.startDateTime = undefined;
    this.region = region;
  }
  ...
}
```

| Session Variable | Description                          |
| ---------------- | ------------------------------------ |
| `sessionId`      | **Unique identifier** to the Session. Is defined at Model instantiation, and represent a unique ID for the session. Every operation involving a specific session must start by getting a session through its `sessionId`  |
| `sessionName`    | A **fancy name**, given at creation by the user, for the Session to make it recognizable at glance. |
| `status`         | Represent the **State Management** of a single session; when the **status** of a session is `active`, temporary credentials are available to the user. The possible values are: `inactive`, `pending`, `active` |
| `startDateTime`  | A **UTC DateTime** string representing the last time a specific Session has started; this is useful for rotation and sorting purposes |
| `region`         | The **AWS Region** or **Azure Location** the Session is working on. For a complete list of AWS Regions go [here](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html), and for Azure Locations, go [here](https://azure.microsoft.com/it-it/global-infrastructure/data-residency/#overview) |
| `type`           | Uniquely identifies two important aspects to determine the Session: **Cloud Provider** and **Access Method.**. Possible values are: `awsIamRoleFederated`, `awsIamUser`, `awsIamRoleChained`, `awsSsoRole`, `azure`. The naming convention we are using is *cloudProvider-accessMethod*: **Cloud Provider** on which you are connecting (i.e., AWS, Azure, GCP...), and the **Access Method** used to generate credentials (i.e., AWS IAM User, Azure Tenant, AWS IAM Role...) |

??? note

    The process of setting up Leapp Sessions is managed either **manually**, for each access method, or through **integrations** with third-party tools. Leapp stores all the Sessions available to the users locally, inside a configuration file called **Workspace.**

