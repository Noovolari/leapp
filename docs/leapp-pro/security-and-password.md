# Password issues

## Can I recover my password?

Unfortunately, it is not possible to recover the master password. The master password is very important as it's the key point of our zero-knowledge encryption mechanism.
If you forget it, you'll lose access to the previously encrypted Leapp Sessions and Integrations.
That's why it is crucial that you keep your password safe; we suggest you to store it in a password manager like 1Password.

## How is my data encrypted?

All information associated with your stored data is protected with end-to-end encryption. 
Leapp Sessions and Integrations are encrypted before being forwarded to the backend. 
Specifically, Leapp Pro uses AES 256-bit encryption as well as PBKDF-SHA512 to secure your data.

AES is a standard in cryptography and is used by the U.S. government and other government
agencies around the world for protecting top-secret data. With proper implementation and a
strong encryption key (your Master Password), AES is considered unbreakable.

PBKDF-SHA512 is used to derive the encryption key from your master password. Then this
key is salted and hashed for authenticating with the Leapp Pro backend. The default iteration
count used with PBKDF2 is 500,000 iterations on the client. Each Secret has its own generated symmetric key; 
this symmetric key is encrypted using the user’s *public RSA key* (this is also the foundation of the Secret sharing system). 
This encryption and decryption are done entirely on the Leapp Pro clients because your *master password* is never stored on or transmitted to Leapp Team backend.

It is important to highlight the fact that the backend does not act as a credentials broker, i.e. it has no visibility on the long-term/short-term credentials 
used by Leapp Pro Desktop App/CLI to access the cloud providers. In addition, the secrets retrieved from the backend, are an encrypted version of access configurations;
access configurations DO NOT include temporary credentials. There is a single edge case: the IAM User. 
Indeed, the IAM User Session access configuration contains IAM User’s access keys, which are long-term credentials. 
Still, the Leapp Pro backend has no visibility on these long-term credentials, as they’re encrypted by the client before being forwarded to the Leapp Team backend.

## Touch ID

When you use [Apple Watch](getting-started/lock.md) or [Touch ID](getting-started/lock.md) to unlock Leapp Pro, using a longer and more secure account password is easier than you might otherwise have chosen.

### Your fingerprint is not stored in Leapp.
Leapp never scans or stores your fingerprint. Touch ID is provided by macOS, which only tells Leapp Pro if your fingerprint was recognized or not.

Learn more about [Touch ID's advanced security technology](https://support.apple.com/HT204587).
