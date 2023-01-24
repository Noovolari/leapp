# What should I know before I get started?
If you want to start a code contribution to Leapp, whether it is a bug fix or a new feature, it is important for you to understand Leapp concepts and way to work.

# Project Structure

Leapp project is structured as a monorepo architecture.

| package       | folder         |
|---------------|----------------|
| [Leapp Core](#core)    | /packages/core |
| [Leapp CLI](#cli)     | /packages/cli           |
| [Leapp Desktop App](#desktop-app) | /packages/desktop-app   |


The Core contains the application logic.

It acts as a library on top of which clients will run. 
In the monorepo scenario, Desktop Application, CLI, and Core are three different projects under the same repository.

In order to better understanding the Leapp App, firstly check out the [Concept page](https://docs.leapp.cloud/latest/sessions/) in our documentation.

# Development environment setup

## Node.js and NPM

Follow [this](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) official guide to install both Node.js and NPM.

The latest build was released using Node.js version 16.14.0 - as specified in the .nvmrc - and NPM version 8.5.5.

## NVM

[Here](https://github.com/nvm-sh/nvm#installing-and-updating) you can find the official installation guide.

## Git

[Here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) you can find the official installation guide.

## Fork and clone through GitHub CLI

Follow [this](https://github.com/cli/cli#installation) guide to install the GitHub CLI.

Log into GitHub (e.g. using your GitHub personal access token) using the following command:

```bash
gh auth login
```

Once logged in, you can fork and clone the repository with the following command:

```bash
gh repo fork noovolari/leapp
```

## Fork and clone manually

If it is the first time you fork a repository from the GitHub console, please refer to [this](https://docs.github.com/en/get-started/quickstart/fork-a-repo) guide.

## Syncing a fork

[This](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) guide explains you how to keep your local branch up-to-date with the upstream one.

## Install dependencies and build packages

At a first glance, you can see that Leapp consists of a monorepo structure that contains **Leapp Core**, **Leapp Desktop App**,
and **Leapp CLI**.
Each of these packages contain its _package.json_ and _tsconfig.json_ file. We will deepen how the project is structured in the
_Project Structure_ section.

Inside the project root folder, run

```bash
nvm use
```

to set the Node.js version to the one specified in the _.nvmrc_. 

Before setting up Core, CLI, and Desktop App packages, run the following command from the root folder:

```bash
npm install
```

which installs _node_modules_ dependencies specified in the root package.json.

From the root folder, run

```bash
npm run set-dev-environment
```

This command is necessary to make both Desktop App and CLI depend on the local Core package, 
not the one published on npm. This saves a lot of time when new features need to be 
implemented in the Core package.

At this point, run the following command to setup the entire project:

```bash
npm run clean-and-bootstrap
```

This _clean-and-bootstrap_ script takes as input one or more of the following packages: _core_, _cli_, or _desktop-app_.

For each of the packages, it:
* removes the _node_modules_ directory;
* removes the package-lock.json file;
* invokes ```npm run clean``` command that cleans additional directories in the specific package;
* invokes _bootstrap.js_ script passing the package name as input.

The _bootstrap.js_ script does two things:
* runs ```npm install``` for the given input package;
* if the input package is the Core, it runs ```npm run build```.

_clean-and-bootstrap_ script, _bootstrap_ script, and other ones are powered by [Gushio](https://github.com/Forge-Srl/gushio).

> Gushio* is built on top of battle-tested libraries like commander and shelljs and allows you to write a multiplatform shell script in a single JavaScript file without having to worry about package.json and dependencies installation.

Once the entire solution is set up and the Core is built, you can focus on building the clients,
i.e. the CLI and the Desktop App.

To build Leapp CLI a script called _prepack_ in _packages/cli/package.json_ can be called.

```bash
npm run prepack
```

To test the CLI locally, execute the _packages/cli/bin/run_ script.

To build and run Leapp Desktop App in the development environment, there is a specific script - called _build-and-run-dev_ -
available in Leapp Desktop App's _package.json_.
 
To run the _build-and-run-dev_ script, use the following command:

```bash
npm run build-and-run-dev
```

## System Vault

Skip this section if you are not using a Linux system.

Leapp relies on the System Vault to save sensitive information. In Linux systems it relies on libsecret and gnome-keyring dependencies. To install them, follow [this](https://docs.leapp.cloud/latest/installation/requirements/) documentation page.

## AWS CLI

[Here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) you can find the official installation guide.

## AWS SSM

To install the AWS SSM agent locally, follow [this](https://docs.leapp.cloud/latest/installation/requirements/) documentation page.

## Azure CLI

[Here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) you can find the official installation guide.

## Core

As described in the introduction of this document, Leapp Core is a library that decouples Leapp's domain logic from the Client that is going to use it.

The core package consists of four main folders: _errors_, _interfaces_, _models_, _services_.

### Errors and logging

Errors and events notification or logging are managed using the two classes _LoggedEntry_ and _LoggedException_.
_LoggedException_ can be instantiated and then thrown specifying the following fields:
* __message__: a human-readable message
* __context__: the class from which the exception is thrown
* __logLevel__: a constant defined in the enum _LogLevel_
* __display__: a boolean value that specifies whether to show the event or error in a toast (only for the desktop app)
* __customStack__: specifies a call stack to attach to the error/event, if not specified, the stack of the method instantiating the object is used

Throwing a _LoggedException_, causes the exit from the current call stack and, if not caught, it will be properly logged (and optionally shown to the user) by the error handler.
```typescript
class LoggedException extends LoggedEntry {
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = true, public customStack?: string) {
    super(message, context, level, display, customStack);
  }
}
```
```typescript
// The following row logs and shows to the user a toast.
throw new LoggedException("To log and show...", this, LogLevel.warn, true);
```
```typescript
// The following row just logs
throw new LoggedException("To log...", this, LogLevel.info, false);
```

_LoggedEntry_ is the superclass of _LoggedException_ and has the same fields.
It __should not be thrown__ but instantiated and passed to the _LoggerService_'s _log()_ method. 

```typescript
class LoggedEntry extends Error {
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = false, public customStack?: string) {
    super(message);
  }
}
```

```typescript
// The following row logs and shows to the user a toast.
this.logService.log(new LoggedEntry("To log and show...", this, LogLevel.warn, true));

// The following row just logs
this.logService.log(new LoggedEntry("To log...", this, LogLevel.info, false));
```

_LoggedEntry_ and _log()_ can be used wherever you want to log without causing the current call stack to exit.

### Models

The Models folder contains TypeScript interfaces that represents the state of Leapp, that is persisted in Leapp’s configuration file, 
and other interfaces that needs to be centralized and used across different logic inside the Leapp Core package.

For what concerns the state of the application, you’ll find a definition of all the supported Sessions and a Workspace object 
which represents the template of the configuration file.

The Workspace includes:

- a list of all the created Sessions;
- the default region and location (region for AWS, location for Azure);
- the IdP URLs the IAM Role Federated Sessions rely on;
- the AWS Named Profiles;
- the AWS SSO Integrations;
- all the Segments created by the user to filter out Sessions while using the desktop application.

For what concerns Sessions, all models share some basic information, common to all of them. These variables must always be defined.

```
...
export class Session {

  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  startDateTime: string;
  region: string;
  type: SessionType;

  ...
}

```

| Session Variable| Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sessionId`      | A **Unique identifier** for the Session. It is defined at Model instantiation, and represents a unique ID for the session. Every operation involving a specific session must start by getting a session through its `sessionId`                                                                                                                                                                                                                                                |
| `sessionName`    | A **fancy name**, chosen by the user when creating the Session, to make it recognizable at first glance.                                                                                                                                                                                                                                                                                                                                                                       |
| `status`         | Represents the **State Management** of a single session; when the **status** of a session is `active`, temporary credentials are available to the user. The possible values are: `inactive`, `pending`, `active`                                                                                                                                                                                                                                                               |
| `startDateTime`  | A **UTC DateTime** string representing the last time a specific Session has started; this is useful for rotation and sorting purposes                                                                                                                                                                                                                                                                                                                                          |
| `region`         | The **AWS Region** or **Azure Location** the Session is working on. For a complete list of AWS Regions go [here](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html), and for Azure Locations, go [here](https://azure.microsoft.com/it-it/global-infrastructure/data-residency/#overview)                                                                                                                                       |
| `type`           | Uniquely identifies two important aspects to determine the Session: **Cloud Provider** and **Access Method.**. Possible values are: `awsIamRoleFederated`, `awsIamUser`, `awsIamRoleChained`, `awsSsoRole`, `azure`. The naming convention we are using is *cloudProvider-accessMethod*: **Cloud Provider** on which you are connecting (i.e., AWS, Azure, GCP...), and the **Access Method** used to generate credentials (i.e., AWS IAM User, Azure Tenant, AWS IAM Role...) |

### Services

Leapp's project is built on a set of **services** that realize the **core functionalities**.

The actual project's structure is structured to allow developers to contribute to source code in the easier and atomic way possible.

In particular, we want to focus the attention on the development of Session Service Patterns and Integrations.

<br>

**Session Service Pattern**

A specific service manages the way each type of Session will handle the process of credentials generation.

![](docs/images/contributing/project_structure/PROJECT_STRUCTURE-1.png)

There is a **three-level abstraction** implementation for this kind of service:

- A general **Session Service** is the top level of abstraction of a Session, it implements the state management of any Session in the app and has three abstract methods for Start, Stop, and Rotate.
- A **Provider Session Service** (i.e., *AWSSessionService*) extends the general session service and handles credentials for a specific Cloud Provider to Start, Stop, and Rotate each Session of this type. This level of abstraction unifies all the common actions for all the Access Methods within a Cloud Provider.
- A **Provider Access Method Service** (i.e., *AWSIAMUserService*) is the concrete implementation of all the information needed to generate the credentials for a specific Access Method. It implements both CRUD methods and the specific steps to generate credentials for a given Access Method.

<br>

**Integrations**

To understand this concept, let’s dive into what the AWS SSO feature does.

In Leapp you can work with Sessions that corresponds to AWS accounts that belong to one or more AWS Organizations. By configuring AWS SSO in the root account (or another dedicated account), you're able to manage access to all of the AWS Organization’s accounts.

AWS SSO configuration is bound to a specific region (e.g. eu-west-1, etc.) and portal URL. The last one corresponds to the endpoint used to log into AWS SSO. By logging into AWS SSO through the AWS SDK, you have access to a token that can be used to list all the accounts and roles that can be accessed by the user. AWS SSO API allows you to automatically generate temporary credentials to access accounts with a specific role. Once you’re done, you can log out from AWS SSO.

From this behaviour we extrapulated the concept of Integration that can be applied to other third-party services like - for example - Okta and OneLogin.

The concept of Integration encapsulates the behaviours described below.

- syncSessions
  - logs into the Integration and gets an access token to exploit its APIs
  - automatically provisions all the accounts and roles that can be accessed by the user through the access token
- logout
  - logs out from the Integration

<br>

**SAML authentication**

When it comes to start an AWS IAM Role Federated Session, Leapp prompts the user with a login page that is specific to the Identity Provider that is
federated with an AWS Account. During the login phase, if Leapp notices that the login session is still valid, the login page will not be shown.

This behaviour is implemented in the [AwsIamRoleFederatedService.generateCredentials](https://github.com/Noovolari/leapp/blob/9889c32e5a8a91760789455a1faa8c82355d69e1/packages/core/src/services/session/aws/aws-iam-role-federated-service.ts#L91) method.

Firstly, the AwsIamRoleFederatedService.generateCredentials method verifies if the login page needs to be displayed; this check is performed through the
[AppAwsAuthenticationService.needAuthentication](https://github.com/Noovolari/leapp/blob/a50630e1f617b6332c2beb7e51fcb0cb5daa4332/packages/desktop-app/src/app/services/app-aws-authentication.service.ts#L26) method.

In particular, the needAuthentication method instantiates a headless Electron BrowserWindow that is responsible for loading the
initial IdP URL and intercepting each possible HTTP redirect call; as soon as it finds a match between a HTTP redirect call and
one of the [preset authentication URLs](https://github.com/Noovolari/leapp/blob/beadb073ea99eb71cdf56982851604172bfdba0a/packages/core/src/services/aws-saml-assertion-extraction-service.ts#L8),
it returns true, i.e. User authentication is needed. On the other hand, in case it finds a match between a HTTP redirect call and
one of the [AWS SAML assertion response URLs](https://github.com/Noovolari/leapp/blob/beadb073ea99eb71cdf56982851604172bfdba0a/packages/core/src/services/aws-saml-assertion-extraction-service.ts#L23),
it returns false, i.e. User authentication is NOT needed.

If any of the preset URLs are matched, the process timeouts after 5 seconds.

The output of the AppAwsAuthenticationService.needAuthentication method is passed to the AppAwsAuthenticationService.awsSignIn one;
awsSignIn extracts the SAML assertion from the SAML response page. The BrowserWindow object, generated by the awsSignIn method,
is shown based on the boolean output of the needAuthentication method.

The extracted SAML assertion is used to perform the AWS STS assumeRoleWithSAML API call which returns new temporary credentials.

<br>

**How to add a new SAML IdP preset authentication URL**

As described above, SAML preset authentication URL can be found in the [packages/core/src/services/aws-saml-assertion-extraction-service.ts](https://github.com/Noovolari/leapp/blob/beadb073ea99eb71cdf56982851604172bfdba0a/packages/core/src/services/aws-saml-assertion-extraction-service.ts#L8) file.
To find out what authentication URL corresponds to you specific IdP configuration, log all the intercepted HTTP redirect call inside the needAuthentication method.

```typescript
// Our request filter call the generic hook filter passing the idp response type
// to construct the ideal method to deal with the construction of the response
idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {

  console.log("Intercepted HTTP redirect call:", details.url);
  
  if (this.leappCoreService.authenticationService.isAuthenticationUrl(CloudProviderType.aws, details.url)) {
    clearTimeout(timeout);
    idpWindow = null;
    resolve(true);
  }
  if (this.leappCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
    clearTimeout(timeout);
    idpWindow = null;
    resolve(false);
  }
  // Callback is used by filter to keep traversing calls until one of the filters apply
  callback({
    requestHeaders: details.requestHeaders,
    url: details.url,
  });
});
// Start the process
idpWindow.loadURL(sanitizedField);
});
```

Execute `npm run rebuild-core-and-run-dev` to rebuild the entire solution and run the Desktop App in dev mode.

As the IdP is new to Leapp, if you start the AWS IAM Role Federated Session, it hangs; this happens because the new IdP authentication URL is not
provided in the present authentication URLs list.

To inspect the list of intercepted HTTP redirect calls, open the developer console using _Option + ⌘ + I_ (on macOS) or _Shift + CTRL + I_ 
(on Windows/Linux) combination. In the _Console_ tab, you can find the logged HTTP redirect calls; from there, discover the right
login url and map it into the [authenticationUrlRegexes](https://github.com/Noovolari/leapp/blob/beadb073ea99eb71cdf56982851604172bfdba0a/packages/core/src/services/aws-saml-assertion-extraction-service.ts#L8)
object through a valid RegEx.

We encourage you to open a Pull Request, so that we can collaborate in the implementation of the new IdP support! 

## Desktop App

Leapp Desktop App is an application built using Electron and Angular. The first is used in order to generate executables for different OSs: macOS, Windows, and Linux distros. 
It serves as a wrapper for the Angular site which hosts the application logic, by serving it through a combination of [Chromium](https://www.chromium.org/Home/) and Node.js.

If you are new to Electron, please refer to the official [documentation](https://www.electronjs.org/docs/latest).

Angular is a front-end web development framework for creating efficient and sophisticated single-page apps via HTML, Typescript, and modern SCSS. 

If you are new to Angular, why not try the excellent **tour of heroes** [sample project](https://angular.io/tutorial) to get you started?

After you got yourself acquainted with our development tools, let’s dig into our code structure.

### Electron project elements

There is an **electron** folder generated by Electron at the root of the repository. It contains the **main.ts** file which drives the application setup and starts the executable by injecting the Angular application into the main BrowserWindow. This is created after the Angular project has been set up, cleaned, compressed, and distributed as a minimized site.

### Angular project elements

The Angular project is wrapped in the Electron one and implements the logic behind each Leapp concept. Let’s dive into the Angular project, from the UX/UI elements to the low level ones, i.e. Models and Services. 

### Angular project elements: Modules

Modules are elements in an Angular project that allows using different components that are defined in the same functional scope. In Leapp we have **3 modules**.

- **app.module.ts**: contains all the **global libraries ad components.** Here you can put all the external libraries that you need.
- **layout.module.ts**: is specific for the layout component, and contains only information that is used in the layout.component.ts file. It is called inside the app module.
- **components.module.ts**: is the module responsible for holding all the components of the application. It is called inside the app module.

There is also one super simple **app.routing.module**, which contains only one route pointing to the layout which contains our **3 main components**: **sidebar**, **command-bar**, **and sessions**.

### Angular project elements: Components

Inside the Component folder, there are all the different components of the applications, which are composed of a UI file in the form of an HTML template, a SCSS file, that contains the style, and finally, 2 TypeScript files: <component>.ts for the logic, and <component>.spec.ts for the unit tests.

Components represent core UI/UX functionalities. If you intend to define a new functionality that must have its UI counterpart, please insert the new component here. 

There is also a dialogs folder that contains, for easiness, all the dialog components of Leapp. 

For us, it is best to create a new component every time we need a new dialog in the interface, just to keep things well separated and DRY.

## CLI

This package consists of a CLI based on Oclif, an open CLI framework. 
Please, refer to the [official Oclif docs](https://oclif.io/docs/introduction) to know how it works.

We organized the CLI's _/src_ folder in **/commands** and **/services** sub-folders.

### Commands folder

Commands folder contains Leapp CLI's commands implementation. Each command takes part of a **scope**. As far as now, there are
five scopes available:

- ipd-url;
- integration;
- profile;
- region;
- session.

Each command extends the **LeappCommand** class, that is an implementation of @oclif/core's **Command** class.

We built the LeappCommand class to introduce some logic before the actual command is executed.
For example, we added a logic that block the command execution if the Desktop App is not installed and running.

To write a new command, from scratch, use the following command template and position it in the proper scope folder (or create a new one).

```typescript
import { LeappCommand } from "../../leapp-command";

export default class HelloWorld extends LeappCommand {
  static description = "hello world";
  static examples = ["$leapp scope hello-world"];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    // write here the command logic
  }
}
```

### Services folder

This folder contains an implementation for each of the following Leapp Core interfaces:

- INativeService;
- IMfaCodePrompter;
- IAwsSamlAuthenticationService;
- IAwsSsoOidcVerificationWindowService;
- IOpenExternalUrlService.

Moreover, you can find the CliProviderService, i.e. a class that is responsible for caching and providing instances used
by Leapp CLI's commands. For example, it caches and provides all the Leapp Core's services instances that are needed by
Leapp CLI's commands.

# Build

This section addresses local development, not releases.

Remember that the root folder's package.json contains the _setup_ script, that can be used to setup all the packages,
i.e. Leapp Core, Leapp CLI and Leapp Desktop App. This script does not build the packages, you've to do it using 
the scripts described below.

## /packages/core

In _/packages/core/package.json_ you can find the _build_ script that you can use to build Leapp Core. The output folder is
placed under /packages/core/dist.

You can run it using the following command from the _/packages/core_ folder:

```bash
npm run build
```

## /packages/cli

In _/packages/core/package.json_ you can find the _prepack_ script that you can use to build Leapp CLI and generate the
oclif.manifest.json file, which is needed to make Oclif aware of the commands available.

You can run it using the following command from the _/packages/cli_ folder:

```bash
npm run prepack
```

## /packages/desktop-app

In _/packages/desktop-app/package.json_ you can find the _build-and-run-dev_ script that you can use to build and run the Electron 
application locally.

If Electron is failing building the native Library `Keytar` just run the following command, before `npm run build-and-run-dev`:

```bash
# Clear Electron and Keytar conflicts
npm run rebuild-keytar
```

# Troubleshooting

To troubleshoot the electron application in the development environment, please refer to [this](https://docs.leapp.cloud/latest/troubleshooting/app-data/) documentation page. Moreover, you may find it useful to open the Developer Tools from the Electron’s BrowserWindow that hosts the Angular application.

# Editor preferences

Editor preferences are available in the [editor config](.editorconfig) for easy use in
common text editors. Read more and download plugins at [editorconfig.org](http://editorconfig.org).

# Linting

We are using [eslint](https://eslint.org/) as our project’s linter. its configuration is defined in the .eslintrc.json file, present in the project’s root folder. There you can find all style rules that apply to the code.

# Conventional Commits and Pull Request

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) document.
