---
title: "Designing safe objects"
layout: "post"
categories: [async, multi-threading, concepts]
---

For an object to be safe, it must not be possible to observe it in an inconsistent state (as long as you follow its documented rules).  For example, it should not be possible to see a collection with a hole in it from the middle of a resize.  

For non-thread-safe objects, this is not very hard.  As long as each function call leaves the object in a consistent state, it doesn't take much effort to enforce this.  It does mean that you must only raise events (or fire callbacks) when the object is in a consistent state.  More subtly, you must only call virtual methods when in a consistent state, since a derived class can call arbitrary code outside the class.  (this is why people criticize Java's approach of making all methods virtual by default).  
Since the object is documented (or assumed to be non-thread-safe, there is no need to ensure that other threads always see a consistent state.

Exceptions, contracts, constructors, reflection, type-safety guarantees


For fully thread-safe objects, this requirement becomes much more difficult.  Because other threads can interact with your object at any time, it must _never_ be in an inconsistent state.  See earlier post.