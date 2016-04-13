---
title: "Securely creating cryptographic keys"
layout: "post"
categories: [cryptography, security, key-storage]
---

Most systems (particularly web applications) will need a variety of random values that should be known only to the server.  These can include production passwords, HMAC signature keys, secrets for session storage, and more.

Here are some guidelines for these secrets:

# Secrets should be _random_
[`correct horse battery staple`](http://xkcd.com/936) is not _remotely_ a good secret.  Separately from the fact that it's now right on top of every brute-force dictionary, it doesn't have nearly enough [entropy](http://en.wikipedia.org/wiki/Entropy_(information_theory)).  

According to that very comic, a four-word password has approximately 44 bits of entropy.  For passwords that you need to memorize, this is an acceptable compromise.  However, application secrets do not need to be memorized.  These secrets should live on your production machines _and nowhere else_.  

If you have a 256-bit secret, there is no reason for it to have anything less than 256 bits of entropy.  Instead of using quirky phrases, you should take 256 bits from a secure random number generator, and use them as your key.  

Equally importantly, secrets should be derived from a secure random number generator.  Do [_not_](https://twitter.com/matthew_d_green/status/656423618918928385) use `rand()` anywhere near crypto code. 

# Hash functions do not add randomness
Cryptographic hash functions can be used to transform a value so that the original value cannot be recovered.  Thus, they are useful for storing passwords, to prevent attackers from being able to recover the original password.

However, hash functions do not add entropy (since they're deterministic).  If you take a low-entropy password (eg, anything that can be typed on a keyboard in under 10 seconds) and hash it with a 256-bit hash, you have not added any entropy.  An attacker who would have tried a dictionary attack with passwords can now try a dictionary attack with hashes of passwords, and will not suffer at all (modern hash functions are extremely fast).

Instead, as mentioned above, secrets should be derived from secure random number generators only.

If you truly need to derive a secret from a password, you should use a salted hash (HMAC, or, preferably, PBKDFv2) with a secure random salt which is kept secret from attackers.

# Secrets should remain secret

 > I will remember that any vulnerabilities I have are to be revealed strictly on a need-to-know basis. I will also remember that no one needs to know.  
 > &ndash; [Evil Overlord List, #198](http://www.eviloverlord.com/lists/dungeon_a.html)
 
In a proper production environment, secrets should _only_ live in the production server.  They should not live in source control; they should not live on a dev's machine; they should not live in Dropbox.

For bringing up new production machines, secrets should be kept in a secure storage environment that can only be accessed by the deployment process.  How to do this depends on your deployment system.

Ideally, any machine that needs access to production secrets should store them encrypted on disk, and decrypt them into memory when launching the process.  Once in memory, care should be taken that the keys are never swapped to disk (eg, using .Net's [`SecureString` class](https://msdn.microsoft.com/en-us/library/system.security.securestring), so that an attacker cannot unplug the machine and grab them from disk (using full-disk encryption will also prevent this).  
There are two main ways to encrypt secrets for production use:

 - Encrypt them with a passsword (deriving an encryption key using [PBKDFv2](http://en.wikipedia.org/wiki/PBKDF2)), then type that password every time the process is launched
 - Encrypt them using a key stored in an [HSM](http://en.wikipedia.org/wiki/Hardware_security_module), and plug it in every time the process is launched.

# Rotate your keys
All keys used for any purpose should be periodically rotated.  This limits the use of brute-force attacks; if it takes a week for an attacker to brute-force a key, but you replace keys every other day, the brute-force attack will be almost useless (except for cyphertexts that the attacker has previously grabbed using the old key).

This is particularly important for keys used with user-facing values (eg, cookie signing or encryption keys).  Depending on how important your cookies are, you may still need to accept cookies generated against an older key (unless you're OK with blowing away all old cookies every time you rotate keys).  If so, you should store in the cookie an ID indicating which key was used.  If you see a cookie with an old key, you should immediately regenerate it with the new key to limit exposure to brute-force attacks.  You should also have a hard limit beyond which a cookie with an old key will not be accepted at all (to prevent brute-force attackers from trying to generate their own cookies; eg, to impersonate another user).

# Practical Advice: Generating Keys
As mentioned repeatedly above, secret keys should come from secure random number generators.  You easily generate a secure random number in one line in a [Node.js](https://nodejs.org) REPL:


<div class="small"></div>
```js
crypto.randomBytes(256 / 8).toString('hex')
```

Or in three lines of C# (eg, in [LINQPad](http://linqpad.net)):

```CSharp
var bytes = new byte[256 / 8];
new System.Security.Cryptography.RNGCryptoServiceProvider().GetBytes(bytes);
Console.WriteLine(BitConverter.ToString(bytes));
```
# Avoiding backdoored randomness
One of the most important requirements when generating keys is a secure source of randomness. 

# Don't spend too much money
A cryptographic key is only as valuable as the data it's protecting.  A signature key used for transmitting game high-scores is nowhere near as valuable as a key used to transmit credit card numbers.  There is no need to invest more time or money in secret storage than the value of the data being protected.

However, any compromises in this vein should be documented, so that they can be corrected if the system is later used for more-valuable data.

----

_Note: Although I have some understanding of the use of cryptographic primtiives, I am not a professional cryptographer._  
Please take any cryptographic advice with a grain of salt (pun intended).  If you are building highly sensitive systems, you should verify with your company's cryptographer (you _do_ have one, right?)