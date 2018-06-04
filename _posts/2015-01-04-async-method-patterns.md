---
title: "Concurrency, part 2: Patterns for Asynchronous Methods"
layout: "post"
categories: [async, promises, concepts, javascript]
---

[Last time](/2014-12-23/parallelism-async-threading-explained), I explained the basic concepts of asynchronous and multi-threaded programming.  As I explained there, the most efficient way to run non-CPU-bound operations concurrently is to call them asynchronously.  However, asynchronous code can be confusing and difficult to work with.  This post will explain different techniques for writing asynchronous functions.  The concepts described in this post apply to all languages; the sample code is in Javascript, running in a Node-like environment.

# The problem
An asynchronous method cannot simply return its value like any other method.  Since the result is computed asynchronously, the method will have already returned before the result arrives.  In multi-threaded languages, this issue can be overcome by synchronously waiting for an asynchronous operation to finish.  However, this completely defeats the point of asynchrony, which is to free up the thread while the operation is in progress.  In single-threaded languages like Javascript, this is completely impossible, since the result cannot even arrive while the method is waiting.

Thus, an asynchronous method must use another approach to return its result.  Asynchrony is viral; any method that calls an asynchronous method must itself become asynchronous.  This effect will propagate up your entire call hierarchy, until the entry-point, which must either wait for the async operation (eg, `Main()` in C# or Java), or can ignore the operation's result (eg, UI event handlers or network request handlers).

# Continuation-passing style (callbacks)
The most basic approach to dealing with asynchronous operations is to use callbacks.  With this approach, each asynchronous function call takes a callback parameter, which will be called when the operation completes.  However, using callbacks in complex programs can be quite annoying.  Performing multiple operations in sequence requires ugly nested callbacks.  Every callback must explicitly check for and handle errors from the operation, with no equivalent of exceptions and catch blocks to handle control flow in error conditions.  There is no way to store an asynchronously-retrieved value before it is ready.

In this approach, no function will ever `return` a value (the `return` statement is only used to exit a function early); instead, all execution flow between functions is handled using callbacks (to signal errors, return values, or just to wait for completion).  This approach is called [continuation-passing style](https://en.wikipedia.org/wiki/Continuation-passing_style).

This approach also relies on convention to tell the callback whether an error occurred.  Node.js uses the convention that the callback's first argument is always the error (or null if the operation succeeded); the result, if any, is passed as the second argument.  Other approaches include passing the callback a status object with a (nullable) error property, or accepting two callbacks; one for success and one for error.

For example:

```js
function addHash(path, callback) {
	fs.readFile(path, function(err, data) {
		if (err) return callback(err);
		var hash = computeHash(data);
		fs.writeFile(path + ".hash", hash, function(err) {
			if (err) return callback(err);
			console.log('Hash written');
			callback(null);	// No error
		});
	});
}
```

# Promises
Promises represent a much better way to handle asynchronous operations.  A promise is an object that represents a value that may arrive some time in the future.  To consume the value, you call a `then()` method and pass a callback, which will run when the value arrives, or immediately if the promise has already been fulfilled.  If this callback returns its own value, you will get a new promise of the resulting value, which you can then add more callbacks to later.  Thus, you can chain asynchronous operations without nesting anything.  If an error occurs, a promise can be resolved to an error state instead of a successful value, which will skip all success callbacks and instead return further rejected promises.  Thus, errors will propagate naturally along a promise chain of asynchronous operations, until they are finally handled by error callbacks later in the chain.  This is directly analogous to `catch` blocks in imperative programming.  Finally, because promises are regular objects, they can be stored in fields just like any other value.

Using promises, the earlier example can be simplified to:

```js
function addHash(path, callback) {
	return qfs.read(path)
		.then(function(data) {
			var hash = computeHash(data);
			return qfs.write(path + ".hash", hash);
		}).then(function() {
			console.log('Hash written');
		});
}
```

[_Next time: More about promises_](/2015-01-05/introducing-promises)