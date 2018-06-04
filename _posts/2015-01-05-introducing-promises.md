---
title: "Concurrency, part 3: Promises – Asynchronous programming made easy"
layout: "post"
categories: [async, promises, concepts, javascript]
---

[Last time](/2015-01-04/async-method-patterns), I explored the two main options for writing asynchronous functions.  Now, I'll describe promises in more depth.  The concept of a promise can be implemented in any language; the sample code is in Javascript, running in a Node-like environment.  Part 4 will describe the details promise frameworks in various other languages.

# Basics
A promise is an object that stores an asynchronously-computed value, or an error.   The only way to consume the promise's value (or error) is to pass it a callback by calling `then()` (some frameworks have different names for the method).  A promise is always in one of three states: unresolved, fulfilled, or rejected.  An unresolved promise has no value yet, and instead stores a list of callbacks to run once the promise is resolved.  In this state, calling `then()` will store the callback in this list to be consumed later.  

Once the operation backing the promise completes, the promise is resolved to a fulfilled or rejected state.  At this point, the resolved value is stored in the promise, and the list of callbacks is executed and cleared.  Once a promise has been resolved, it becomes completely immutable, storing only the result.  Passing a callback to a resolved promise will execute it immediately.  Some implementations will execute callbacks on resolved promises synchronously, making `then()` a potentially reentrant call; others, including all standards-compliant Javascript promises, will always run it asynchronously in a threadpool or a later message loop).

Note that a promise can only be resolved once.  Thus, promises are only useful for operations that complete once and result in a single value (or collection).  If you have an operation that can finish in multiple stages (eg, if it can have change events, or if different parts come in at different times), promises will not help; instead, you can use a stream abstraction, such as Node.js [streams](https://github.com/substack/stream-handbook/blob/master/readme.markdown) or .Net [Reactive Extensions](https://rx.codeplex.com/).

# Creating promises
Promises are created from asynchronous operations.  Modern asynchronous methods (eg, most new .Net APIs, and promise-aware Javascript libraries) will generally return promises themselves, letting you consume them without further effort.  You can also create promises from other things, as described below.

Multi-threaded environments like C# or Java 8 also have thread pool APIs that run code in a background thread, then return a promise of the eventual result of the code.  This is particularly useful in UI applications, to run CPU-bound work in a background thread, then consume the result in the UI.

You can also create promises manually.  This is necessary when calling older asynchronous APIs that accept callbacks instead of returning promises.  It can also be useful for more unusual asynchronous operations, such as creating a promise that will be resolved when a user clicks a button or closes a dialog, or waiting for specific commands to come in over a live network stream.

To create a promise manually, you need functions to call to manually resolve or reject the new promise, passing the resolved value or the rejection error.  Your code would call these functions in the callback for the underlying operation, fulfilling the promise when the operation is finished.  You then need to get the resulting promise object, which, while itself readonly, will reflect the fulfillment from your function calls.

Most promise frameworks provide this using a Deferred object (in .Net, this is called TaskCompletionSource), which is a mutable wrapper around a promise.  The deferred object exposes its promise as a readonly property, and provides resolve and reject as member functions.  Since deferred objects are mutable, they should not exposed publicly; instead, they should only be used to wrap the underlying asynchronous operation.  The public interface (property or return value) should only expose the generated promise.

For example:

```js
function readFilePromise(path) {
	var deferred = new Deferred();
	fs.readFile(path, function(err, data) {
		if (err)
			deferred.reject(err);
		else
			deferred.resolve(data);
	});
	return deferred.promise;
}
```

Modern Javascript promise implementations introduced a cleaner way to create a promise from an existing asynchronous method.  You can create a new promise and pass a resolver callback.  The promise constructor will this callback immediately, passing the resolve and reject functions as parameters.  This makes scope management easier; instead of having a separate `deferred` variable, the mutable part of the promise is intrinsically scoped to the resolver callback.  This may not work for more advanced operations, such as resolving a promise based on a UI event or a particular network response, but it's a much nicer way to wrap existing callback-based functions.

For example:

```js
function readFilePromise(path) {
	return new Promise(function(resolve, reject) {
		fs.readFile(path, function(err, data) {
			if (err)
				reject(err);
			else
				resolve(data);
		});
	});
}
```

More sophisticated promise libraries will also include helper methods to "promisify" existing async methods using standard callback patterns, such as Q's [`nfcall` & friends](https://github.com/kriskowal/q#adapting-node) or C#'s [`TaskFactory.FromAsync` overloads](https://msdn.microsoft.com/en-us/library/system.threading.tasks.taskfactory.fromasync).

Finally, most promise frameworks include convenience methods to create pre-resolved or pre-rejected promises from existing values (useful when an async API has a synchronous "fast path" such as a cache), as well as promises that will be resolved after a given delay.

# Composing promises
The biggest advantage to promise-based asynchrony is the ease of composition.  You can return a value from a promise callback to get a new promise which will be resolved to that value once the original promise completes.  This lets you easily create functions that compute values based on the result of an existing async operation, simply by returning the computed value from the promise callback, and returning the resulting promise from the function.  

You can also return another promise from a promise callback, giving you a promise that will be resolved once this second operation finishes.  This lets you chain together a sequence of asynchronous by simply returning the promise for each new operation from successive then() callbacks on the resulting promises.  This is much nicer than nesting multiple completion callbacks from old-style async methods.  In effect, this lets the inner promise &ldquo;escape&rdquo; from the scope of its promise callback, giving you a promise of its result in the original function.

For example:

```js
var initialPromise = someAsyncFunction();
var delayedPromise = initialPromise.then(function(result) {
	return someOtherAsyncFunction(result);	// Returns a promise
});
// delayedPromise will be resolved with the 
// result of someOtherAsyncFunction()
var thirdPromise = delayedPromise.then(function(result) {
	return Object.keys(result).length;
});
// thirdPromise will be resolved with the
// number of properties after the other 2
// promises are resolved.
```

More formally, this feature is an example of a [monad](https://en.wikipedia.org/wiki/Monad_%28functional_programming%29) &ndash; a generic type that &ldquo;amplifies&rdquo; (adds more features to) any existing type.  Other examples of monads include collection types, which amplify an existing type to store a number of values of that type, and optional/maybe types, which store either a `None` placeholder or a single value.  The monadic _unit_ operation, which creates a promise from an existing value, is `Promise.resolve()` (or equivalents in other frameworks).  The mondaic _bind_ operation, which applies a function to the value in a monad and returns a new monad containing the function's result(s), is the `then()` method.  This is what makes promises chainable.  For a deeper introduction to monads, see [Eric Lippert's excellent series of blog posts](https://ericlippert.com/2013/02/21/monads-part-one/).

Promise frameworks will also include helper methods to consume collections of other promises.  `Promise.all()` takes a collection of promises and returns a new promise of an array of the results of these promises, thus waiting for all of the promises to be resolved.  This can be used to kick off a number of asynchronous operations in parallel, then wait for them all to finish.  `Promise.any()` takes a collection of promises and returns a promise of the result of the first promise to be resolved (ignoring all of the other promises).

For example:

```js
function getWeather(city) {
	// Try 3 services and use whichever one answers first.
	return Promise.any([
		httpRequestPromise('https://weather1.example.com', { city: city }),
		httpRequestPromise('https://weather2.example.com', { city: city }),
		httpRequestPromise('https://weather3.example.com', { city: city })
	]);
}

function getTripWeather(itinerary) {
	return Promise.all(itinerary.cities.map(function(city) {
		return getWeather(city);
	}));
}
```

# Error handling
Promises can also store error state.  When an asynchronous operation fails, the resulting promise will be rejected rather than resolved, storing the error instead of the result.  When this happens, none of the regular `then()` callbacks will run; instead, the promises returned by the `then()` calls will themselves be rejected.  Thus, errors will automatically propagate down a promise chain; once an error occurs, the rest of the handlers will be skipped, until the error is handled.  If an exception is thrown in any promise callback, the promise returned by that callback will also be rejected.  Similarly, if a promise callback returns a promise (from a chained async operation) which is rejected, the next promise returned by `then()` will also be rejected.

To handle errors, you can add an error callback, typically either by passing a second callback to `then()` or by passing a callback to a separate function like `fail()`.  These behave exactly the same as `then()` callbacks, except that they will only run when the promise is rejected.  A resolved (as opposed to rejected) promise will skip error callbacks, just like a rejected promise skips normal callbacks.

Error callbacks will only handle errors from earlier in the promise chain.  If you add both a success callback and an error callback in the same call (by passing two callbacks to `then()`), exactly one of the callbacks will run, depending on the fulfillment of the original promise.  In contrast, if you call `.then(callback).fail(otherCallback)`, and the original promise succeeds, but the first callback throws its own error, both callbacks will run (since you're calling `fail()` on the rejected promise from the `then()` callback).

Error callbacks are still chainable; the promise returned by `fail()` will be resolved to whatever the callback returns.  This means that once you add an error callback, the rest of the chain will keep running after an error occurs (error callbacks handle their errors).  To prevent this, you can simply rethrow the error from the error callback, causing the next promise to be rejected again.

In effect, error callbacks behave exactly like `catch` blocks in imperative programming.  Just like classical exceptions, once an error occurs (whether the original operation failed, or whether a callback threw any kind of error), the rest of the code (other callbacks) until the &ldquo;catch block&rdquo; (error callback) will be skipped.  After the &ldquo;catch block&rdquo;, the rest of the code (further chained callbacks) will continue running, unless the &ldquo;catch block&rdquo; rethrows the error.

For example:

```js
someFailingFunction()	// Returns a rejected promise
	.then(function(result) {
		// This code will not run
	})
	.fail(function(error) {
		console.log('Uh oh!', error);
		return 3;
	})
	.then(function(result) {
		console.log(result);	// Prints 3
		// Had the original operation not failed, this 
		// would have received the result of the first
		// then() callback.
	});

```

# Unit testing
Asynchronous functions create special challenges for unit tests.  A unit test for an asynchronous function must wait until the async part of the method finishes, and must catch exceptions or assertion failures that are raised in asynchronous continuations (in `then()` callbacks).  A naive unit test that does not somehow wait for asynchronous operations to complete won't actually test anything; if the asynchronous part fails, it will never be reported.

To solve this issue, most modern test runners allow unit tests to return promises.  The test runner will check whether each test returns a promise, and, if it does, will wait for the promise to be resolved before concluding the test.  If the returned promise is rejected, it will mark the test as failed, with the rejection reason as the failure message.  

Therefore, you can call an asynchronous function in a test, add a `then()` callback that makes assertions about the result, and simply return that promise chain.  If the assertions fail, the assert function will throw an exception, causing the promise returned by `then()` to fail, and failing the test.

For example:

```js
function testSquareAsync() {
	return squareAsync(2)	// In real code, squaring a number should not be async
		.then(function(result) {
			assertEquals(4, result);
		});
}
```

To test that a method fails, you can add a success callback that throws an error and an error callback that handles the original error and asserts about it:

```js
function testAjaxFailure() {
	return httpRequestPromise('https://cannot parse')
		.then(function(result) {
			assertFail('Expected failure but returned ' + result);
		}, function(error) {
			assertEquals(error, 'Bad URL');
		});
}
```

[_Next time: Comparing promises in different languages_](/2015-01-08/comparing-different-languages-promises-frameworks)