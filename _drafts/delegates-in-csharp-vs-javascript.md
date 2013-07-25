---
title: "Delegates: C# vs. Javascript"
layout: "post"
categories: [Javascript, HTML, CSS]
---

Most people would define delegate as a type-safe reference to a function.  However, delegates also have two other features that C-style function pointers lack: closures and multicasting.

There are [four ways]({% post_url 2011-06-14-open-delegates-vs-closed-delegates %}) to create a delegate in .Net:

 1. An open delegate to a static method
 2. A closed delegate to an instance method, on a particular instance
 3. A closed delegate to a static method, closing over the first parameter (eg, extension method)
 4. An open delegate to an instance method, calling the method on the first parameter to the delegate (reflection only; no syntactic support)

Also, .Net delegates can be multicast; a single delegate can refer to multiple functions.  Calling such a delegate will execute all of those function in order.  This is how most events are implemented.

Javascript function objects can be made to look like delegates using `call()` and `bind()` together.

However, there is no shortcut to creating multicast delegates in Javascript. 

https://github.com/SLaks/jsDelegate