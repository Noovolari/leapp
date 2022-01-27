# Contributing to this project

Please take a moment to review this document in order to make the contribution
process easy and effective for everyone involved.
For any request or help needed feel free to talk with us on [Slack](https://join.slack.com/t/noovolari/shared_invite/zt-noc0ju05-18_GRX~Zi6Jz8~95j5CySA) or send us an email at [info@noovolari.com](mailto:info@noovolari.com)

## Using the issue tracker

[GitHub Issues](https://github.com/Noovolari/leapp/issues) is the preferred channel
for [bug reports](#bug-reports), [features requests](#feature-requests)
and [submitting pull requests](#pull-requests).

Please respect the following restrictions:

- Please **do not** use the issue tracker for personal support requests (email
  [info@noovolari.com](mailto:info@noovolari.com)).

- Please **do not** derail or troll issues. Keep the discussion on topic and
  respect the opinions of others.

## Bug Reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been
   reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
   latest `master` or development branch in the repository.

3. **Demonstrate the problem** &mdash; provide clear steps that can be reproduced.

A good bug report should not leave others needing to chase you up for more
information. Please try to be as detailed as possible in your report. 
What is your environment? 

What steps will reproduce the issue? 

What OS experienced the problem?

What would you expect to be the outcome? 

All these details will help to fix any potential bugs.

## Feature Requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to _you_ to make a strong
case to convince the project's developers of the merits of this feature. Please
provide as much detail and context as possible.

## Pull Requests

Good pull requests (patches, improvements, new features) are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise, you risk spending a lot of time working on something that might
not get accepted into the project.

**IMPORTANT**: by submitting a patch, you agree to allow the project owner to
license your work under the same license as that used by the project.


## Submitting changes

Please send a [GitHub Pull Request to Leapp](https://github.com/noovolari/leapp/pull/new/master) with a clear list of what you have changed. You can use the provided template to fill in the details. Tip: Learn more about [pull requests](http://help.github.com/pull-requests/)). 

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Examples:

    feat: Add new cloud provider
    
    docs: Fix typo in Readme


You can find the list of supported commit types [here](https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-conventional/README.md#type-enum).

Please ensure to always write a clear log message for your commits. One-line messages are fine for small changes, bigger changes should include more context to understand the change quickly. Example:

    $ git commit -m "feat: a brief summary of the commit
    > 
    > A paragraph describing what changed and its impact."

## Developer Certification of Origin (DCO)

Leapp requires the Developer Certificate of Origin (DCO) process to be followed.

The DCO is an attestation attached to every contribution made by every developer. In the commit message of the contribution, the developer simply adds a Signed-off-by statement and thereby agrees to the DCO, which you can find below or at http://developercertificate.org/.

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

## DCO Sign-Off Methods

The DCO requires a sign-off message in the following format appear on each commit in the pull request:

    Signed-off-by: John Doe <johndoe@leapp.cloud>

The DCO text can either be manually added to your commit body, or you can add either **-s** or **--signoff** to your usual git commit commands. If you are using the GitHub UI to make a change you can add the sign-off message directly to the commit message when creating the pull request. If you forget to add the sign-off you can also amend a previous commit with the sign-off by running **git commit --amend -s**. If you've pushed your changes to GitHub already you'll need to force push your branch after this with **git push -f**.

Example for updating a PR after missing the sign-off:

    $ git clone https://github.com/<yournamespace>/leapp.git
    $ cd leapp
    $ git checkout <branch-name-in-your-fork>
    
    $ git commit --amend -s
    $ git push -f 
    
If there are multiple commits to be signed off, you can use **git rebase --signoff HEAD~<number-of-changes** since Git 2.12. Example for the latest 2 commits:

    $ git rebase --signoff HEAD~2
    $ git push -f

For more info about the sign-off process, please refer to [this](https://www.secondstate.io/articles/dco/) guide by WasmEdge.
