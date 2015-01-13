---
title: "Concurrency, part 1: Parallelism, Asynchrony, and Multi-threading Explained"
layout: "post"
categories: [async, multi-threading, concepts]
---

Concurrent programming techniques, such as multi-threading or asynchronous operations, are all the rage nowadays.  As Moore's law begins to fail, the industry is turning to concurrency to deliver the next generation of performance boosts.  Every hot new development framework makes some kind of claim to run efficient asynchronous or multi-threaded code.  With all of this hype, however, it's easy to get confused about the exact meanings of  “multi-threading”, “parallelism”, and “asynchrony”, and the difference between them.

#About asynchrony
An asynchronous operation is an operation which continues in the background after being initiated, without forcing the caller to wait for it to finish before running other code.

When calling a typical, synchronous function, your code calls the function, and does not continue until the function is completely finished.  If the function is CPU-bound (if all it does is compute values, without waiting for replies from anything else), this makes sense.  The CPU is busy computing the result of the function, and doesn't have time to do anything else (at least, on that thread).

However, if the function is not CPU-bound &ndash; if it simply waits for something else to finish &ndash; this makes less sense.  If all the function does is wait for a response from a hard drive or database or web service, or even from a camera or other USB device, there is no need to keep the CPU busy waiting for that response instead of doing useful work.  In that case, your entire program (or thread, in a multi-threaded environment) is stuck waiting for no reason.

This is why asynchronous operations exist.  Instead of blocking the calling program (or thread) until a response arrives, an asynchronous (also called _non-blocking_) implementation will send of a request to the database or web service or whatever, then return immediately, letting your program continue running other code while the remote service sends a reply.  Once the response arrives, the system will run a callback (either on your message loop or in a separate IO completion port thread, depending on the environment), letting your code handle the response.

#About multi-threading
Multi-threading means running more than one thread of execution at a time.  In this model, all operations are still synchronous, but the CPU will execute multiple threads of synchronous operations at the same time.

Multi-threading makes most sense when calling multiple (and independent) CPU-bound operations, on a multi-core processor.  For example, a program that independently analyzes every pixel in an image could divide the image into one strip for each CPU core, then analyze each strip in its own thread at the same time.

Note that there is no advantage gained in running more threads than there are CPU cores.  Threads do not magically let CPUs do more work for free; once you run out of dedicated cores to run your threads, you'll end up with single cores running bits of each thread in turn, adding additional context-switching overhead as the core switches to each thread, and not getting any performance benefit.

#How to best manage concurrent / parallel operations
Concurrency or parallelism simply mean running more than one operation at the same time.  This can be accomplished using either asynchrony or multi-threading.  However, different kinds of operations lend themselves towards different kinds of concurrency.

If you have strictly CPU-bound work, multi-threading is your only option.  The whole point of asynchrony is to leave the CPU (and your thread(s)) free, so that you can run other code while waiting for the asynchronous operations to finish.  If your work is CPU-bound, running it asynchronously does not make sense.

If you have non-CPU-bound work (disk IO, network requests, etc), both options can work.  However, running the operations asynchronously will offer better performance.  Parallelizing non-CPU-bound work using multiple threads means making each request on its own dedicated thread, blocking that thread until the response arrives.  However, threads are not cheap; creating each thread occupies a megabyte or more of memory for the stack and limited kernel resources, and also adds more context-switching overhead.  This places artificial limits on the total number of in-flight requests.

In contrast, asynchrony offers much better parallelism with non-blocking operations.  You can kick off thousands of non-blocking requests from a single thread with very little per-request overhead, then schedule callbacks to run when each request finishes.  Your original thread is then free to do whatever else it likes (such as actual CPU-bound work, kicking off more async requests, or accepting incoming connections).

Switching non-CPU-bound operations to non-blocking implementations can offer tremendous performance and scalability benefits, simply because threads are not cheap.  At a previous job, I rewrote a long-running and massively parallel network server to use non-blocking IO, and the throughput improved from 900 connections per server to over 9,000 connections per server.

#Handling UI threads
All of the discussion so far has been focused on raw performance for server-side or backend scenarios.  However, asynchrony and multi-threading have one other, unrelated use: UI threads.

While your UI thread is busy (with any kind of operation), it will not accept any UI events, making your application hang and making users unhappy.  Therefore, it is extremely important that all potentially long-running operations, whether CPU-bound or IO-bound, not run on the UI thread.

For CPU-bound operations, this simply means running them in a background thread; for non-CPU-bound operations, this can either mean running them in a blocking fashion in a background thread, or running them asynchronously from the UI thread.  Unlike server scenarios, scalability usually isn't a concern for UI applications (there generally aren't thousands of operations to worry about), so it doesn't actually matter much which approach you choose.

#Availability in Programming Languages
As mentioned earlier, asynchrony and multi-threading are completely orthogonal concepts, and different languages expose different options.

 - Javascript is completely single-threaded (with the subtle exception of web workers, which still cannot share memory between threads), but also completely asynchronous.  With very few exceptions (deprecated synchronous `XmlHttpRequest`s in the browser, and the `fs.*sync()` in  Node.js), every non-CPU-bound operation in Javascript is only available asynchronously.  
  This is why Node.js is so popular and scalable.  Because everything runs asynchronously, as long as you don't have any CPU-bound work, you can scale to thousands of concurrent requests with very little overhead (limited only by the memory consumed for each request).
 - Java, by contrast, is fully multi-threaded, with a powerful system of Executors and synchronization primitives, but has extremely little support for asynchronous operations.  Before Java 8, Java had no built-in asynchronous operations, although there are some third-party libraries that offer async network IO.  
 - C# is both asynchronous and multi-threaded.  Like Java, it has a rich threading API, but unlike Java, it has had asynchronous IO methods since day 1.  .Net 4.5 introduced simple-to-use asynchronous IO methods using the TPL and `Task<T>`, replacing the older, more cumbersome APM-based methods (`Begin*()` and `End*()`).  However, outside the core .Net framework, many third-party libraries still do not offer asynchronous versions of IO-bound operations.

[_Next time: Patterns for Asynchronous Methods_](/2015-01-04/async-method-patterns)
