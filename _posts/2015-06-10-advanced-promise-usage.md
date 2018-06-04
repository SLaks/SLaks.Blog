---
title: "Concurrency, part 5: Advanced Promise Usage"
layout: "post"
categories: [async, promises, concepts, javascript]
---

[Last time](/2015-01-08/comparing-different-languages-promises-frameworks), I listed standard & third-party promise libraries in popular languages, comparing how each one implements the promise paradigm.  In this post, I'll describe some advanced patterns for promise usage.

# Error handling
One of the more useful features of promise-based asynchrony is automatic propagation of errors.  However, just like traditional exception handling, this feature is only useful if errors are correctly propagated up the call stack until they reach a method that knows how to handle them.  

Promise-based error handling adds an additional concern in that errors are only passed along explicit promise chains.  If you write a function that creates a promise chain and ignores it (without returning the resulting promise to its caller), errors in that chain will typically be silently ignored; this can hide serious bugs in your code.

These concerns translate into a simple set of guidelines.  There are two kinds of methods that may involve errors: Library methods, which will throw errors, but do not know how to handle them, and application methods, which typically will not throw errors of their own, but do know how to handle errors from library methods that they call.  Given this distinction, the guidelines are as follows:

 - Do not swallow errors.  If you call a method that returns a promise, you should either handle errors from that promise directly (for application methods), or return the promise to your caller so that it can handle errors elsewhere.
  - This is not a hard-and-fast rule.  If a library method invokes an operation and knows that no-one can possibly care about any failures (for example, if it tries two equivalent service endpoints, and one fails and the other succeeds), it may swallow the errors.  If possible, it should log the errors to help application developers troubleshoot unexpected scenarios.
  - If a library method creates multiple promise chains, it can use `Promise.all()` to observe errors from any branch in the chains (consult the documentation for your promise library to find out how this behaves when multiple errors occur; many libraries have an alternative version of this method that will wait for every error).
  - If you don't want to wait the method's returned promise to wait or all of the promise chains to finish, you should probably refactor the method into multiple methods; each function should generally only serve one purpose.  The caller can then call each operation separately and wait for its result or handle errors as appropriate.
 - Any reusable asynchronous function should (almost) always return a promise that consumes all of the function's asynchrony, allowing callers to wait for the entire operation to finish and to observe any errors that occurred.
  - In C#, this means that you should never write reusable `aync void ` methods (`Async Sub` in VB); instead, always use `async Task`, so that callers can wait for & observe the result.
 - Entry-point methods in applications should always handle errors from their promise chains & async method calls, displaying an error to the user and/or sending an error report to the developer.
  - For Javascript, the Q library has a useful `done()` helper method, which can be called at the tip of a promise chain to throw any errors and trigger the environment's default unhandled error notifications (`window.onerror` in a browser, or the error event in `process` for Node.js).  This is a convenient way to handle errors from promise chains in your application methods, especially if you already have a generic error handler for this event.
 - If a library method wants to add more context to an error, it can add an error callback that wraps the exception in a new exception with additional detail (making sure to preserve the inner exception details as well), then rethrows the new exception.  This will reject the rest of the promise chain with the new error, just like `throw new MySpecificException("...", ex)` would inside a traditional `catch` block.

In summary, **never leave a promise chain &ldquo;dangling&rdquo;**.  Instead, either return the resulting promise to your caller, or handle errors yourself at the end of the chain.

# Calling asynchronous methods in loops
One common challenge when working with asynchronous operations is running an asynchronous operation in a loop over a collection of source items.  Here too, promises can help simplify your code.  The technique for doing this depends whether you want to run in sequence or in parallel.  

## Parallel Operations
If your operations are completely independent, and can run in parallel, you can simply kick off all of them at once, then wait for all of the promises to complete.  In Javascript, this looks like this:

```js
var items = [...];
var allDone = Promise.all(items.map(function(item) {
    return someFunctionAsync(item)
		.then(...);
}));
```

This code creates an array of promises from the array of items, then waits for all of them to finish.  The resulting `allDone` promise will resolve to an array of the results of each of the original items.  You can build a promise chain inside the `map()` callback to perform a whole sequence of operations on each item and have each sequence run in parallel.  If you need to wait for all of the items to complete before continuing with further parallel operations, you can build a second set of parallel promise chains from the result of the first promise:

```js
allDone.then(function(results) {
	var average = results.reduce(function(a, b) { return a + b; }) / results.length;
	return Promise.all(results.map(function(item) {
		return otherFunctionAsync(item, average)
			.then(...);
	});
});
```

This second set of promise chains will also run in parallel, but will only start after all of the first chains finish.

## Sequential operations
Running a collection of asynchronous operations in sequence is more complicated.  If you don't want each operation to start until the previous operation finishes, you must build a chain of promises, like this:

```js
var items = [...];
items.reduce(function(promise, item) {
    return promise.then(function() {
        return someFunctionAsync(item);
    });
}, Promise.resolve());
```

This code uses the [`Array.reduce()` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce) to build up a chain of promises, executing each function after the previous one finishes.  The first parameter to the callback is the promise returned from the previous iteration (for the first item, it'll be the `Promise.resolve()` passed as the second parameter to `reduce()`).  The `reduce()` callback adds a handler to that promise to execute the async operation on the current item, and returns the resulting promise, so that the next iteration will wait for it in turn.  The effect looks like this:

```js
Promise.resolve()
    .then(function() { return someFunctionAsync(items[0]); })
    .then(function() { return someFunctionAsync(items[1]); })
    .then(function() { return someFunctionAsync(items[2]); })
    ...
```

The value of the `promise` passed into the `reduce()` callback is the result of the asynchronous function from the previous iteration.  Therefore, you can easily combine the current item with the result of the previous item.

If you need an array of the results of all of the operations, you need to build the array from the promise results (starting with an empty array in the initial promise):

```js
var items = [...];
items.reduce(function(promise, item) {
    return promise.then(function(results) {
        return someFunctionAsync(item)
            .then(results.push.bind(results))
            .then(function() { return results; });
    });
}, Promise.resolve([]));
```

# Passing state along a promise chain
When writing more-complex asynchronous workflows, you may need to pass state along a promise chain, from an intermediary promise result to a later promise callback.  For example, you might need to asynchronously fetch a post, fetch its author, then render both objects.

Unfortunately, there is no good way to do this.  The best option is to build an array of all of the objects you need, using `Promise.all()` to wait for new promises while keeping existing values:

```js
loadPost(id)
    .then(function(post) {
        return Promise.all([post, loadAuthor(post.authorId)]);
    })
    .then(function(results) {
        var post = results[0];
        var author = results[1];
        // Do something with both values.
    })
```

Calling `Promise.all()` here will return a promise of the post and the author, which will be resolved once the author loads.  This call is necessary because returning a simple array from a `then()` callback will not wait for the promises in the array.  Without it, you would still have a promise of the author in the second callback.

In Javascript, the Q promise library has a [`spread()` method](https://github.com/kriskowal/q/wiki/API-Reference#promisespreadonfulfilled-onrejected) to simplify this pattern.  This method is like `then()`, but will flatten the array into individual parameters.  It will even call `all()` for you, so you can return an array of promises and it will wait for all of them to be resolved first.  It would simplify the above code:

```js
loadPost(id)
    .then(function(post) {
        return [post, loadAuthor(post.authorId)];
    })
    .spread(function(post, author) {
        // Do something with both values.
    })
```

If you need to load multiple items in separate steps, you can keep building larger and larger arrays of all of the items you need to load (obviously, you should try to load them in parallel &ndash; by returning multiple promises in a single array &ndash; where possible).

# Caching asynchronous operations
Another common task when writing asynchronous code is to cache the result of an asynchronous operation.  As long as whatever you're doing is reasonably idempotent (eg, loading data that rarely changes, or executing a fixed version of an external script file), you will generally want to load it just once, and have future calls reuse the first call.  This technique is called [memoization](https://en.wikipedia.org/wiki/Memoization).

When doing this, you must be careful to avoid race conditions.  If you only cache each call after the result arrives, you can still end up making multiple calls if the second call is made before the first one responds.  Instead, you should cache the promise of the result immediately, so you can return that promise directly for the next call, whether it has loaded or not.  However, if the call returns an error, you will presumably want to clear it from the cache so that the next call can try again (unless you know it's a permanent error).

In Javascript, you might write the following code to memoize any single-argument asynchronous function:

```js
function memoizeAsync(fn) {
	var map = Object.create();
	return function(arg) {
		if (map[arg]) return map[arg];
		return map[arg] = fn(arg)
			.thenCatch(function(error) {
				if (!isPermanent(error))	// Unless we know that it isn't worth retrying,
					delete map[arg];		// Remove this argument to try again next time.
				throw error;				// Rethrow the error so the result still fails.
			});
	};
}
```

In multi-threaded environments (ie, not Javascript), you must also beware of thread-safety.  You can do this lock-free fashion by using a [compare-and-swap loop](/2013-07-29/creating-lock-free-data-structures) to insert the promise into an immutable map.  Make sure to only actually send the request after the compare-and-swap loop completes successfully, at which point you know that only your thread has added the value.  (Depending on how your request call works, you may need to add a promise resolver to the map, then resolve it to the request result after sending it.)



[_Next time: Using await for easier asynchrony in C#_](/2015-06-11/easier-csharp-async-with-await)
