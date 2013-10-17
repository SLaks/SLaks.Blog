---
title: "Common Cryptographic Pitfalls"
layout: "post"
categories: [cryptography, security, mistakes]
---


#Don't re-invent the car
Correctly using cryptographic primitives is _hard_.  If at all possible, you should not use raw cryptographic primitives (even well-accepted ones like AES, RSA, or SHA2) directly; instead, you should use professionally-built and reviewed protocols that use these systems, such as SSL/TLS, NaCl, KeyBox, and others.

There are all sorts of subtle issues that professional cryptographers know about and you don't (eg, various padding or timing vulnerabilities), and these higher-level wrappers address these issues for you.

There have been lots of security issues resulting from projects that attempt to build their own protocols, and get these wrong.

#Don't re-invent the wheel
Even if you do need to use primitives directly, stick to known, well-researched primitives.

In particular, _please_ don't try to build your own encryption or hash algorithms.

#Learn as much as possible
Especially if you use primitives directly, learn about things like padding attacks, replay vulnerabilities, and the like.

Every bit of cryptographic lore you learn may help you stop a real-world attacker.

#Don't reuse keys

#Create a threat model
It is important to understand what you're trying to prevent

#Use IVs

#Don't reuse IVs

#Use authenticated encryption

#Use random nonces

#Don't expose any information
Never show an error message

#Validate everything
**Don't** be liberal with what you accept

----

_Note: Although I have some understanding of the use of cryptographic primtiives, I am not a professional cryptographer._  
Please take any cryptographic advice with a grain of salt (pun intended).  If you are building highly sensitive systems, you should verify with your company's cryptogrpaher (you _do_ have one, right?)