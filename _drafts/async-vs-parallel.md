---
title: "Asynchrony vs. Multi-threading, part 2: Parallelism"
layout: "post"
categories: [async, multi-threading, concepts, C#]
---

`Parallel.For()` and PLINQ `AsParallel()` are used to run _blocking_ code in parallel.

However, these won't work properly for asyncronous operations.  If you pass an `async void` delegate, you will have no way of waiting for the asynchronous parts to finish.

Instead, you need `Task.WhenAll()`, which waits for a number of non-blocking operations running in parallel to all finish.

You only need actual parallelism if you have long _blocking_ delays before the async parts.  Otherwise, the parallelism will just add overhead before the asyncrony kicks in and code stops running.  Parallelism will also have no effect on synchronous code that runs after an `await`.