---
title: "Securely creating cryptographic keys"
layout: "post"
categories: [cryptography, security, key-storage]
---

Most systems (particularly web applications) will need a variety of random values that should be known only to the server.  These can include production passwords, HMAC signature keys, secrets for session storage, and more.

Here are some guidelines for these secrets:

#Secrets should be _random_
[`correct horse battery staple`](http://xkcd.com/936) is not _remotely_ a good secret.  Separately from the fact that it's now right on top of every brute-force dictionary, it doesn't have nearly enough [entropy](http://en.wikipedia.org/wiki/Entropy_(information_theory)).  

According to that very comic, a four-word password has approximately 44 bits of entropy.  For passwords that you need to memorize, this is an acceptible compromise.  However, application secrets do not need to be memorized.  These secrets should live on your production machines _and nowhere else_.  

Therefore, if you have a 256-bit secret, there is no reason for it to have anything less than 256 bits of entropy.

#Hash functions do not add randomness

#Secrets should remain secret

 > I will remember that any vulnerabilities I have are to be revealed strictly on a need-to-know basis. I will also remember that no one needs to know.  
 > &ndash; [Evil Overlord List, #198](http://www.eviloverlord.com/lists/dungeon_a.html)
 
In a proper production environment, secrets should _only_ live in the production server.  They should not live in source control; they should not live on a dev's machine; they should not live in Dropbox.

For bringing up new production machines, secrets should be kept in a secure storage environment that can only be accessed by the deployment process.

Ideally, any machine that needs access to production secrets should store them encrypted on disk, and decrypt them into memory when launching the process.  Once in memory, care should be taken that the keys are never swapped to disk (eg, using .Net's [`SecureString` class](), so that an attacker cannot unplug the machine and grab them from disk.  
There are two main ways to encrypt secrets for production use:

 - Encrypt them with a passsword (deriving an encryption key using [PBKDFv2]()), then type that password every time the process is launched
 - Encrypt them using a key stored in an [HSM](), and plug it in every time the process is launched.

#Rotate your keys

#Practical Advice: Generating Keys

#Avoiding backdoored randomness

#Don't spend too much money
A cryptographic key is only as valuable as the data it's protecting.  A signature key used for transmitting game high-scores is nowhere near as valuable as a key used to transmit credit card numbers.  There is no need to invest more time or money in secret storage than the value of the data being protected.

However, any compromises in this vein should be documented, so that they can be corrected if the system is later used for more-valuable data.

----

_Note: Although I have some understanding of the use of cryptographic primtiives, I am not a professional cryptographer._  
Please take any cryptographic advice with a grain of salt (pun intended).  If you are building highly sensitive systems, you should verify with your company's cryptogrpaher (you _do_ have one, right?)