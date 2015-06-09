---
title: "Cryptography vs. Security"
layout: "post"
categories: [cryptography, security, mistakes]
---


Cryptography cannot by itself make things secure.  
In general, all that cryptography can do for you is transfer existing security from point A to point B.

For example, one-time pads transfer security in time only.

Classical encryption is only as secure as the key.

There is _no way_ to use cryptography alone to prove who you're talking to.

##You must understand what you're securing
You cannot simply "add security" to an existing system.
Instead, you must specify exactly what you want to prevent, who you're defending against, and what security boundaries exist and where.

For example, you can build a thorough encryption system, but forget to verify the remote party and end up allowing trivial MITM attacks.

Or you could build a bullet-proof, encrypted, authenticated banking system, but do nothing to prevent replay attacks and allow recipients to replay a transaction and make the sender pay over and over again.

In particular, learn how your use cases affect requirements for the crypto algorithms (eg, key reuse, attacker-controlled inputs, padding oracles), and figure out what you need to prevent (eg, authentication, replay).

##Understand the requirements of your crypto algorithms
This usually means, use a secure RNG, and don't reuse keys.


 - Learn how to use your RNG: http://android-developers.blogspot.com.au/2013/08/some-securerandom-thoughts.html
 - Learn where it's safe to reuse keys

 > Sony PS3 master signing key broken due to reuse of randomness across different EC-DSA key pairs

----

_Note: Although I have some understanding of the use of cryptographic primtiives, I am not a professional cryptographer._  
Please take any cryptographic advice with a grain of salt (pun intended).  If you are building highly sensitive systems, you should verify with your company's cryptographer (you _do_ have one, right?)