---
title: "Tasks are not Promises"
layout: "post"
categories: [C#, .Net, task, promise]
---

.Net 4.0 introduced the `Task` and `Task<T>` class for dealing with asynchronous operations.  These classes heavily resemble promises.

However, there are some subtle differences to be aware of.

 - `Task`s can contain a delegate
 - `OnlyOnFaulted` returns canceled on success