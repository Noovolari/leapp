**Leapp is built with a security-first approach.** Every information that has to be persisted is encrypted and saved on your workstation.

We devised two main methods to store data, based on its sensitiveness.

| Data | Persistence and encryption | Examples |
| ----------- | --------- | ---- |
| Operational | All information used to make Leapp work, not strictly tied to direct access to cloud environments. Stored and encrypted in a configuration file within the user workspace.  | Named profiles, proxy configurations, etc. |
| Sensitive   | Information that can be used, or potentially exploited, to gain access to cloud environments. Stored in the System Vault, leveraging its own integrated encryption. | Static credentials, access tokens, cached data, etc. |

## End-to-end Encryption

We leverage [Zero-Knowledge](security/zero-knowledge) to provide end-to-end encryption on tiers that require to save your data outside of your workstation to deliver specific features.

**Zero Knowledge is designed so that no one, except you, can access your secured data.**

!!! Warning
    We CAN'T access your data under any circumstances, even if you ask us to!
