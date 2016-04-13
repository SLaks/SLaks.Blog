---
title: "Concurrency, part 4: Comparing promises frameworks in different languages"
layout: "post"
categories: [async, promises, concepts, javascript]
redirect_from: "/2015-01-08/promises-frameworks-langauge-comparison/"
---

[Last time](/2015-01-05/introducing-promises), I explained what promises are and how they work.  Now, I'll explore standard & third-party promise libraries in popular languages, explaining how they implement each facet of the promise paradigm.

# .Net languages (C#, VB, etc...)
The .Net base class library includes promise classes called [`Task`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task) and [`Task<TResult>`](http://msdn.microsoft.com/en-us/library/dd321424).  These classes were introduced in .Net 4.0, released in 2010.  `Task` is used for promises which have no value (simply running callbacks once the operation is complete); `Task<TResult>` inherits `Task` and exposes a value as well.

## Methods
 - The then() method, which adds a callback to the promise, is called [`.ContinueWith()`](http://msdn.microsoft.com/en-us/library/dd321274).  It has a number of overloads which take different kinds of delegates, letting you pass callbacks that don't return anything, return a synchronous value, or return a further promise for chaining.  All of these methods return a new `Task` or `Task<TResult>` instance.  The callback receives the original `Task<T>` object rather than the result; you can access the result using the `Result` property.
 - `.ContinueWith()` will, by default, run its callback even if the task failed.  However, if the original task failed, accessing the `Result` property inside the callback will rethrow the exception, skipping the rest of the callback.  You can add callbacks that only run on success or failure by passing `TaskContinuationOptions.OnlyOnRanToCompletion` or `TaskContinuationOptions.OnlyOnFaulted`.
 - The Deferred object used to create promises from existing asynchronous operations is called [`TaskCompletionSource<TResult>`](http://msdn.microsoft.com/en-us/library/dd449174).  
  - You can also create tasks from legacy APM (Asynchronous Programming Model, using `IAsyncResult`) using the [`Task.Factory.FromAsync()` methods](http://msdn.microsoft.com/en-us/library/system.threading.tasks.taskfactory.fromasync).
 - Promise creation helper methods include [`Task.FromResult()`](http://msdn.microsoft.com/en-us/library/hh194922) and [`Task.FromException()`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.fromexception) to create pre-fulfilled tasks, [`Task.Delay*(`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.delay) to create a task that will be resolved at a specified time in the future, and [`Task.WhenAll()`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.whenall) and [`Task.WhenAny()`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.whenany) to wait for multiple tasks.
 - You can run code on a background thread and get a promise of its eventual result by calling [`Task.Run()`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.run).

## Behavior
By default, `.ContinueWith()` will always run the callback asynchronously (using the current `TaskScheduler`), avoiding reentrancy bugs.  You can override this behavior by passing `TaskContinuationOptions.ExecuteSynchronously`.

Tasks also support cancellation.  Cancellation is a third fulfillment state that is mostly parallel to rejection.  When creating a new Task from a `TaskCompletionSource`, you can call `SetCancelled` to set the resulting task to canceled.  If a `.ContinueWith()` callback throws a `TaskCancelledException` or `OperationCanceledException`, the resulting task will also be canceled.  Cancellation is designed to be used together with the [`CancellationSource` system](http://msdn.microsoft.com/en-us/library/dd997364) to cancel operations and callbacks.

Since .Net is a multi-threaded environment, you can also synchronously wait for task to finish by calling [`.Wait()`](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.wait).  This will block the calling thread until the task is fulfilled, so it should not be called on a UI thread or in highly multi-threaded environments when threads are scarce.

Most confusingly, the `Task` class can also represent a delegate running on a background thread.  You can create a new task from a delegate, which will return an unstarted task object.  Calling `Start()` on this instance will run the delegate on its `TaskScheduler` and eventually resolve the task to its result.  This use (and the entire `Start()` method) is confusing and should be avoided; instead, simply call `Task.Run()`.  

C# 5.0 & VB 11.0 took this one step further with language-level asynchrony using the [`await` keyword](http://msdn.microsoft.com/en-us/library/hh191443), allowing you work with promises just like you would write synchronous code.  Behind the scenes, the compiler transforms async code into a series of promise callbacks.  Jon Skeet wrote a series of blog posts explaining [exactly how this transformation works](http://blogs.msmvps.com/jonskeet/2011/05/08/eduasync-part-1-introduction/).

## Availability
.Net 4.5 introduced `*TaskAsync()` versions of most of the framework's non-CPU-bound operations, including stream IO, HTTP requests, database connections, and more.  Note that the async methods in [`DbConnection`](http://msdn.microsoft.com/en-us/library/system.data.common.dbconnection) & [`DbCommand`](http://msdn.microsoft.com/en-us/library/system.data.common.dbcommand) will by default run synchronously and return a pre-completed task; it's up to the derived connection clients to override these methods with non-blocking implementations.  The built-in `SqlConnection` does override these methods; other ADO.Net providers may or may not.

All modern .Net unit testing frameworks have some level of support for async tests; for more details, see [Stephen Cleary's article on async .Net unit tests](http://msdn.microsoft.com/en-us/magazine/dn818494.aspx).  Recent versions of ASP.Net MVC and Web API also allow async actions that return Tasks; ASP.Net vNext (6.0) also adds support for async action filters.  Entity Framework also added support for async queries and updates (assuming the underlying provider implements async correctly) [in version 6](http://msdn.microsoft.com/en-us/data/jj819165.aspx).

Outside Microsoft's standard libraries, the situation is murkier.  Older open source libraries for network-bound operations frequent lack async methods or implement them incorrectly (by running a blocking call on a thread pool thread instead of a non-blocking call).  Newer libraries are more likely to get this right, especially with the introduction of language-level async support in 2012.  Stephen Cleary wrote an excellent set of [guidelines on how to properly write async APIs](http://msdn.microsoft.com/en-us/magazine/jj991977.aspx).

# Java 7 &ndash; Guava
Java's promise story is murkier.  Java 1.5 introduced the [`Future<T>` interface](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Future.html), which looks like a promise, but actually isn't.  A `Future<T>` does indeed represent a value which will be computed later, but it offers no way to notify upon completion &ndash; it has no `then()` method.  All you can do with a future is synchronously wait for it to be completed.  Thus, it is completely useless for non-blocking asynchronous operations.

To solve this, Google's [Guava library](https://code.google.com/p/guava-libraries/) has its own promise-like interface called [`ListenableFuture<T>`](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/util/concurrent/ListenableFuture.html).  This interface extends the standard `Future<T>` and adds a single `addListener()` method that takes a `Runnable` callback and an `Executor` to run the callback with (letting you control whether the callback will run synchronously or not).   This is an extremely simple API designed to be easy to implement; the callback will run on both success and failure and does not allow chaining.  Instead, the full richness & convenience of the usual promise APIs are available as static methods in the [`Futures` class](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/util/concurrent/Futures.html).
x
## Methods
By default, callback methods will run synchronously.  You can make them run asynchronously by passing an `Executor`.

 - The then() method is `Futures.transform()`, which has overloads that take a callback returning a synchronous value or a further promise (if you don't need to return a further promise, use `Futures.addCallback()`).  
 - To handle errors, call `Futures.withFallback()`.  This does not have an overload that accepts a promise-returning callback; if you need one, use `Futures.dereference()` to turn a `ListenableFuture<ListenableFuture<T>>` into a `ListenableFuture<T>`. 
 - The Deferred object is [`SettableFuture<T>`](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/util/concurrent/SettableFuture.html), which implements `ListenableFuture<T>` and adds mutation methods to resolve or reject the promise.
 - Promise creation helpers include `Futures.immediateFuture()` and `Futures.immediateFailedFuture()` to create pre-fulfilled promises, as well as `Futures.allAsList()` and `Futures.anyAsList()` to wait for multiple promises.
 - You run code on a background thread in a Java `Executor` and get a promise of the result by wrapping the executor in [`MoreExecutors.listeningDecorator()`](http://docs.guava-libraries.googlecode.com/git-history/release/javadoc/com/google/common/util/concurrent/MoreExecutors.html#listeningDecorator(java.util.concurrent.ExecutorService)) and calling `submit()`

For more information, see [Guava's introduction to ListenableFuture](https://code.google.com/p/guava-libraries/wiki/ListenableFutureExplained).

# Java 8
Java 8 finally introduced a built-in promise interface, [`CompletionStage<T>`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletionStage.html).

## Methods
Every method in `CompetionStage` has three variants: `method(callback)` runs its callback synchronously, `methodAsync(callback)` runs the callback asynchronously on the common ForkJoinPool, and `methodAsync(callback, executor)` runs the callback asynchronously on the specified executor.  

 - The then() method is represented by a number of methods, depending on whether the callback consumes the value and/or returns a new value.  `thenAccept()` consumes the value and returns void.  `thenApply()` consumes the value and returns a different value.  `thenCompose()` consumes the value and returns a new promise.  `thenRun()` consumes nothing and returns nothing (it accepts a simple `Runnable`).  
 - To handle errors, call `exceptionally()`, or `handle()` to run a callback whether the stage was resolved or rejected.
 - The Deferred object is [`CompletableFuture<T>`](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html), which implements CompletionStage (and is in fact the only built-in implementation), and adds mutator methods to resolve, reject, or cancel the promise.
 - Promise creation helpers are `CompletableFuture.allOf()`, `CompletableFuture.anyOf()`, and `CompletableFuture.completedFuture()`. 
 - CompletionStage also has binary versions of all() and any() as instance methods.  Call `stage1.{accept|applyTo|runAfter}Either(stage2, callback)` (parallel to the standard then() variants listed above) to add a then() callback to whichever promise completes first.  Call `stage1.{thenAccept|runAfter}Both()` to add a `then()` callback to both promises together.
 - You run code on a background thread in a Java `Executor` and get a promise of the result by calling `CompletableFuture.runAsync()` (returns a promise of void) or `CompletableFuture.supplyAsync()` (returns a promise of a value).

## Availability
Unfortunately, CompletionStage is not used anywhere in the JDK standard library.  There are third-party async libraries that return CompletionStages.

# Javascript
Javascript has a much richer ecosystem of promises.  Because Javascript is strictly single-threaded, JS programmers have had to deal with asynchrony since day 1.  Different asynchronous APIs have taken different approaches to this; earlier browser APIs such as `XmlHttpRequest` uses events, and Node.js uses callbacks everywhere.  Promises slowly began to arrive onto this landscape, including jQuery's original version of [`$.Deferred`](http://api.jquery.com/category/deferred-object/) or Closure's [`goog.async.Deferred`](http://docs.closure-library.googlecode.com/git/class_goog_async_Deferred.html), which are mostly, but not entirely, like promises.  Later came a variety of Node.js and/or browser-based promise libraries, including [Q](http://api.jquery.com/category/deferred-object/), [Bluebird](https://github.com/petkaantonov/bluebird), and many others.  Most recently, the upcoming ECMAScript 6 standard includes a [`Promise` class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) (although many third-party implementations such as Q have richer APIs).

To simplify this mess, Kris Kowal, Domenic Denicola, and others put together the [Promises/A+ spec](https://promisesaplus.com), which codifies exactly how Javascript promises should behave.  Promises/A+ specifies how promise resolution should work, and the exact signature and behavior of the `then()` method for adding success & error callbacks and chaining.  It leaves everything else up to the individual implementations; most notably, it makes no mention of how to create a promise in the first place.  

All modern promise implementations, including [Q](http://api.jquery.com/category/deferred-object/), [Bluebird](https://github.com/petkaantonov/bluebird), [Angular's `$q`](https://docs.angularjs.org/api/ng/service/$q) (which is based on Q), [Bluebird](https://github.com/petkaantonov/bluebird), Closure's [goog.Promise](http://docs.closure-library.googlecode.com/git/class_goog_Promise.html), but with the notable exception of jQuery, including the ES6 promise class implement Promises/A+, and also add promise creation and convenience methods.  The Promises/A+ site has a [full list of conforming implementations](https://promisesaplus.com/implementations).

## Methods
 - The then() method is precisely specified by Promises/A+, and is thus (almost) the same in every implementation.  `then()` accepts a success callback followed by a failure callback (both of which are optional), and will always call them asynchronously (on the next message loop iteration).
  - Many promise implementation add a third parameter to specify the `this` parameter with which to call the callbacks.
 - To add error callbacks, pass the second parameter to then.  Most implementations also add a convenience method to only add an error callback; ES6 promises have `.catch()`; Q has `.catch()` or `.fail()`, and Closure promises have `.thenCatch()`.
 - The Deferred objects vary between implementations.  ES6 promises and Q 2.0 use a promise constructor as described previously.  Q 1.0 has `Q.defer()`, which creates a Deferred object; Closure promises have `goog.Promise.withResolver()` which returns a similar object.
 - Promise creation helpers include `Promise.resolve` and `Promise.reject` to create pre-fulfilled promises, as well as `Promise.all()` and `Promise.race()` to consume multiple promises.  These names are the same in most promise implementations.

For more details, consult the documentation for your specific implementation.

## Availability
There are no standard APIs that return promises (yet).  However, there are a large variety of open-source libraries (for Node.js and the browser) that expose promise-based APIs.

One of the advantages of the Promises/A+ standard is that all every standards-compliant implementation should be interoperable.  You can take a promise from one implementation, and return it from a `then()` callback, or pass it to `all()` or `race()`, in a different implementation, and everything should work fine.  This is particularly useful when consuming a library that uses a different promise implementation than your code uses.

# jQuery Promises
jQuery introduced its own promise-like abstraction in version 1.5, [`$.deferred()`](http://api.jquery.com/category/deferred-object/).  This feature was introduced before promises had a widespread standard API, and its API changed substantially in version 1.8 to align more closely with other promise libraries.  jQuery still has one notable difference; promise callbacks are always executed synchronously (directly within `resolve()` or `then()`).  jQuery deferreds also support the notion of a progress callback, which can be invoked multiple times before the promise is resolved to report incremental progress.

## Methods
 - The then() method is [`then()`](http://api.jquery.com/deferred.then/), accepting optional success, failure, and progress callbacks and returning a chained promise of the callback's return value.
 - Deferreds also have `done()` and `fail()` methods which add callbacks directly, **but do not return a new promise**.  Instead, they return the original promise instance, like normal jQuery method chaining.  This means that they can be used to add multiple callbacks to the same original value.  However, the return value from the callback is completely ignored; to create further promises, you must use `.then()`.  
 - `$.deferred()` returns a mutable deferred object, which can be used to resolve the promise.  Call `.promise()` on this object to get a readonly promise reflecting the result of the deferred.
 - jQuery has just one promise creation helper, [`$.when()`](http://api.jquery.com/jQuery.when/).  You can pass a single value to this method to create a resolved promise of the value.  You can pass multiple jQuery promises (not other promise implementations) to this function to create a promise that waits for all of them.  Note that you cannot pass an array of promises (if you do, you'll get a resolved promise of that array itself); you must pass the promises individually.  If you have an array, you can call `$.when.apply(null, promisesArray)` to pass each item in the array as a separate parameter.

## Availability
jQuery returns promises from all of its asynchronous operations.  `$.ajax()` (and equivalent helper methods like `$.get()`, `$.getJSON()`, or `$.getScript()`) return jqXHR objects which are promises with additional AJAX-related properties.  jQuery objects also have a `.promise()` method which returns a promise of the end of the element(s)'s animation queue.  This lets you easily wait for animations to finish running before continuing with other code via promise chains.



[_Next time: Advanced promise development guidelines_](/2015-06-10/advanced-promise-usage)