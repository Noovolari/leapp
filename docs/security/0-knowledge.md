!!! Warning

    This concept is implemented in the PRO and TEAM version of Leapp.

!!! Info
  
    You don't know PRO and TEAM versions yet? Come and check the [roadmap](#).

Leapp PRO and Leapp TEAM implement the concept known as **0-Knowledge**, used for instance by [BitWarden](https://bitwarden.com/). 
0-Knowledge means that there is no data left unencrypted on our side. All information is **encrypted end-to-end** 
and only the **final user as the encryption key needed to view the data**.

## Users have key control for zero knowledge encryption

When users have complete control of the encryption key, they control access to the data, providing encrypted 
information to Leapp without Leapp having access to, or knowledge of, that data.

This is **the fundamental premise** on which [0-knowledge managers work](https://bitwarden.com/resources/zero-knowledge-encryption-white-paper/).

## Main criteria

- During any phase of the **registration and login process the client do not provide any password related info to the server**.
- The server **do not store any information that can be used to guess the password in a convenient way**, in other words the system must not be prone to brute force or dictionary attacks.
- **Any sensible data is encrypted client-side**, server will work with encrypted blocks only.
- All the **implementation is released as open source**.

## Technologies used

- **PBKDF2** for client hashing. 
- **AES 256** for simmetric cypher.
- **RSA** asimmetric cypher.
- **BCrypt** for server hashing.

