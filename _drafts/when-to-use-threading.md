---
title: "When to use multi-threading"
layout: "post"
categories: [async, multi-threading, concepts]
---

Stories like this may sound familiar:

 1. My app is much too slow!
 2. Slap `new Thread(() => { ... }).Start()` and/or `ThreadPool.QueueUserWorkItem()` and/or `Parallel.ForEach()` and/or `Task.Run()` around everything
 3. Oh, no! Everything's broken!
 4. Slap `lock(this)` around everything
 5. Now it's even slower!
 6. Repeat?

Threading is not a silver bullet that will magically make any program faster.  In fact, depending on what your program does, chances are that threads won't help you at all.