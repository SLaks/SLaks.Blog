---
title: "Chains of Trust – The Root of all Security"
layout: "post"
categories: [security]
---

The entire field of computer security is dedicated to verifying the source, confidentiality, or integrity of information or communication.  This includes guaranteeing that the web page or other resource you're seeing actually came from the entity you're trying to reach (and has not been modified); guaranteeing that information you transmit will only be readable by that entity, or that the user connecting to a server is actually in possession of a token.

This raises a problem.  Security may be all about trust and authentication, but how can you establish that trust in the first place?  Without some existing indicator of identity, all the cryptography in the world cannot tell whether the data you're receiving came from Bob, or from Mallory pretending to be Bob.  If you start from a blank slate, any kind of proof you could ask Bob for can easily be duplicated by Mallory, leaving you none the wiser.  

To solve this chicken-and-egg problem,

Bootstrapping - voice authentiation for OTR chat