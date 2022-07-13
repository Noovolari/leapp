To persist your configuration online, we implemented **Zero-Knowledge encryption** to prevent access to your information. But how can you trust a company to keep all of your secrets secret? The answer lies in end-to-end encryption, which lays the groundwork for applications with Zero-Knowledge architectures.

> Zero-knowledge refers to policies and architecture that eliminate the possibility for secret managers themselves to access your password.

!!! Warning

    This is implemented to save your configuration online in the PRO and TEAM versions of Leapp.</br>
    Don't know yet about the PRO and TEAM versions? Check our [roadmap](https://roadmap.leapp.cloud/tabs/4-in-progress){: target='_blank'}.

!!! Info

    This same process is leveraged by [Bitwarden](https://bitwarden.com){: target='_blank'} to store their password. 

## Users have key control

When users have complete control of the encryption key, they control access to the data, providing encrypted information to Leapp without Leapp having access to or knowledge of that data.

!!! Info

    To know more about this, you can find [the whitepaper](https://bitwarden.com/resources/zero-knowledge-encryption-white-paper) on which we based our implementation of Zero-Knowledge end-to-end encryption.

## Criteria

** During any phase of the registration and login process **the client does not provide any password-related info to the server**.
- The server **does not store any information that can be used to guess the password in a convenient way**. In other words, the system must not be prone to brute force or dictionary attacks.
- **Any sensible data is encrypted client-side**, the server will work with encrypted blocks only.
- All the **implementation is released as open-source**.

## Technologies

- **PBKDF2** for client hashing.
- **AES 256** for symmetric cypher.
- **RSA** with 4096-bit keys for asymmetric cypher.
- **BCrypt** for server hashing.
