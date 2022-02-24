# Contributing to Leapp

First of all, thank you for contributing to Leapp!

The goal of this document is to **provide all the information you need to start contributing.**

Please, feel free to propose changes to this document in a pull request [Pull Request template](https://github.com/Noovolari/leapp/blob/master/.github/PULL_REQUEST_TEMPLATE.md).

Contributions and questions are not just welcome, **they’re essential!** 

Please open issues with ideas on how to improve Leapp, including feedback, critiques, and information about how you’re using it. Discussion is at the heart of the project and your thoughts and ideas will help make it better for everyone, thank you. 💙

You can chat with us inside our community so [join us](https://join.slack.com/t/noovolari/shared_invite/zt-noc0ju05-18_GRX~Zi6Jz8~95j5CySA), or feel free to contact us via the email at info@noovolari.com.

# Code of Conduct

Here in Leapp, we aim to create great things by collaborating in the most respectful, inclusive, and effective way possible. This way to work is governed by a Code of Conduct document [Contributor Covenant Code of Conduct](./.github/CODE_OF_CONDUCT.md).

# How can I contribute?

You can start contributing to Leapp by

- [Reporting bugs](#reporting-bugs)
- [Suggesting enhancements or new features](#suggesting-enhancements-or-new-features)
- [Submitting your first code contribution](#your-first-code-contribution)

Any other idea to contribute that we missed? Submit a Pull Request to share it with us!

[GitHub Issues](https://github.com/Noovolari/leapp/issues) is the preferred contribution channel, but not the only one! You can suggest enhancements or new features in Leapp’s [public roadmap](https://roadmap.leapp.cloud/tabs/4-in-progress). TOCHANGE LINK

When creating a new issue through the [GitHub Issues](https://github.com/Noovolari/leapp/issues) channel, it’s really important to understand if it is a “beginner-friendly” one. Beginner-friendly issues can be a good starting point for new contributors; that’s the reason why you can label them as “good first issue”. Visit [here](https://github.com/noovolari/leapp/contribute) and make your first contribution to this repository by tackling one of the listed good first issues.

Contributors can start contributing even in “help wanted” issues. These are issues maintainers want help on.

Please respect the following restrictions:

- Please **do not** use the issue tracker for personal support requests email info@noovolari.com.
- Please **do not** derail or troll issues. Keep the discussion on topic and respect the opinions of others.

## Reporting bugs

A bug is a *demonstrable problem* that is caused by the code in the repository.

Prior to reporting a bug, please check if it is already tracked using the GitHub issue search. If it is marked as fixed but you are still experiencing it, add a comment to the issue’s discussion so that we can re-open it.

To report a new bug we ask you to follow the template that you can find [here](https://github.com/Noovolari/leapp/issues/new?assignees=&labels=bug&template=bug-report.md&).

This template guides you during the definition of the bug. It includes:

- a description of the bug;
- the Leapp’s version you encountered the bug with;
- the steps needed to reproduce the bug;
- the behavior you expected from the application in the described context;
- optional screenshots that provide information to further describe the context;
- information about the local system you are running Leapp on;
- additional context;
- how it is important to you (nice to have, important, critical).


## Suggesting enhancements or new features

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the project's developers of the merits of this feature. **Please
provide as much detail and context as possible.**

As for bug reporting, there is a template for new feature requests too. You can find it [here](https://github.com/Noovolari/leapp/issues/new?assignees=&labels=enhancement&template=feature_request.md). It includes:

- a description of an eventual problem the feature is related to;
- a description of the solution you would like;
- eventual different alternatives you’ve considered;
- additional context;
- how it is important to you (nice to have, important, critical).

You can even submit your feature request idea from our [public roadmap board](https://roadmap.leapp.cloud/tabs/4-in-progress).

Please consult the [public roadmap](https://roadmap.leapp.cloud/tabs/4-in-progress) to get an overview of new ideas that were accepted by Leapp maintainers.

## ****Your First Code Contribution****

Do you want to implement something from scratch or fix an issue?

This is the first time you’re contributing to Leapp. “good first issues” and “help wanted” issues could be a nice starting point for you to get your hands dirty with the codebase.

For more info about how to start developing and proposing changes, please refer to the development.md [DEVELOPMENT.md](./DEVELOPMENT.md) document.

# Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Examples:

```
feat: Add new cloud provider

docs: Fix typo in Readme

```

You can find the list of supported commit types [here](https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-conventional/README.md#type-enum).

Please ensure to always write a clear log message for your commits. One-line messages are fine for small changes, bigger changes should include more context to understand the change quickly. Example:

```
$ git commit -m "feat: a brief summary of the commit
>
> A paragraph describing what changed and its impact."

```

We rely on both [husky](https://github.com/typicode/husky) and [commitlint](https://github.com/conventional-changelog/commitlint) to check if the commit follows conventional commits’ guidelines.

Before submitting your Pull Request, take your time to squash the commits related to your fix/feature. The same convention is applied to the Pull Request name; we suggest making the commit name match with the Pull Request one.

# Pull Requests

Good pull requests (patches, improvements, new features) are a fantastic
help. They should remain focused on the scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise, you risk spending a lot of time working on something that might
not get accepted into the project.

**IMPORTANT**: by submitting a patch, you agree to allow the project owner to
license your work under the same license as that used by the project.

Please send a [GitHub Pull Request to Leapp](https://github.com/noovolari/leapp/pull/new/master) with a clear list of what you have changed. Tip: Learn more about [pull requests](http://help.github.com/pull-requests/)).

# Developer Certification of Origin (DCO)

Leapp requires the Developer Certificate of Origin (DCO) process to be followed.

The DCO is an attestation attached to every contribution made by every developer. In the commit message of the contribution, the developer simply adds a Signed-off-by statement and thereby agrees to the DCO, which you can find below or at [http://developercertificate.org/](http://developercertificate.org/).

```
Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
have the right to submit it under the open source license
indicated in the file; or

(b) The contribution is based upon previous work that, to the
best of my knowledge, is covered under an appropriate open
source license and I have the right under that license to
submit that work with modifications, whether created in whole
or in part by me, under the same open source license (unless
I am permitted to submit under a different license), as
Indicated in the file; or

(c) The contribution was provided directly to me by some other
person who certified (a), (b) or (c) and I have not modified
it.

(d) I understand and agree that this project and the contribution
are public and that a record of the contribution (including
all personal information I submit with it, including my
sign-off) is maintained indefinitely and may be redistributed
consistent with this project or the open source license(s)
involved.

```

### DCO Sign-Off Methods

The DCO requires a sign-off message in the following format appear on each commit in the pull request:

```
Signed-off-by: John Doe <johndoe@leapp.cloud>

```

The DCO text can either be manually added to your commit body, or you can add either **-s** or **--signoff** to your usual git commit commands. If you are using the GitHub UI to make a change you can add the sign-off message directly to the commit message when creating the pull request. If you forget to add the sign-off you can also amend a previous commit with the sign-off by running **git commit --amend -s**. If you've pushed your changes to GitHub already you'll need to force push your branch after this with **git push -f**.

Example for updating a PR after missing the sign-off:

```
$ git clone <https://github.com/><yournamespace>/leapp.git
$ cd leapp
$ git checkout <branch-name-in-your-fork>

$ git commit --amend -s
$ git push -f

```

If there are multiple commits to be signed off, you can use **git rebase --signoff HEAD~<number-of-changes** since Git 2.12. Example for the latest 2 commits:

```
$ git rebase --signoff HEAD~2
$ git push -f

```

For more info about the sign-off process, please refer to [this](https://www.secondstate.io/articles/dco/) guide by WasmEdge.
