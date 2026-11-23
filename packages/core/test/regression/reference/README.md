# Workspace regression baseline

Fixtures and golden files for `packages/core/test/regression/workspace-regression.spec.ts`, recorded by `record-baseline.ts` from the Leapp 0.26.1 code base. The tests keep core reading and writing workspaces and `~/.aws` files exactly as 0.26.1 did.

| Path | What it is |
|---|---|
| `<name>.workspace.json` | Fixture workspace (plaintext `class-transformer` serialisation) with every session type, integrations, IdP URL, profiles and non-default settings. `credential-file` uses the credentials file method and adds a LocalStack session; `credential-process` uses the credential process method. Fake account `111111111111`, no secrets. |
| `encrypted/<name>.Leapp-lock.json` | The same workspace encrypted by `crypto-js` with the test key `ls-bump-001-test-machine-id`. |
| `initial/aws-credentials`, `initial/aws-config` | `~/.aws` files written by other tools, present before Leapp starts any session. |
| `golden/<name>.after-load-save.json` | The workspace core writes after loading and saving the fixture. |
| `golden/<name>.aws-credentials`, `golden/<name>.aws-config` | `~/.aws` files after starting every AWS and LocalStack session with mocked STS / SSO, including the `js-ini` rewrite. |

To re-record, on purpose only: `REGRESSION_RECORD=baseline npx jest --testMatch '**/record-baseline.ts' --coverage=false test/regression/record-baseline.ts` from `packages/core`.
