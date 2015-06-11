---
title: "Concurrency, part 6: Easier asynchrony in C# with await"
layout: "post"
categories: [async, promises, multi-threading, concepts, C#]
---
[Last time](/2015-06-10/advanced-promise-usage), I described more advanced patterns for complicated workflows involving asynchronous operations.  These patterns can be annoying to write.  However, modern compilers can bear the brunt of this complexity, allowing you to write code as if the operations were synchronous, then letting the compiler transform your code into mes promise chains. 

C# 5 introduces this with its flagship new [`async` / `await` keywords](http://msdn.microsoft.com/en-us/library/hh191443).  However, the wealth of possibilities opened by this feature has left many developers confused about when to make `async` methods and when not to.

#Non-blocking IO
The `async` keyword does not _create_ asynchrony; instead, it allows you to call existing asynchronous methods easily.  If your code isn't calling any existing `*Async()` methods (which return `Task` or `Task<T>`), `async` won't do any you good.  However, if you have the option of calling synchronous or asynchronous versions of an operation (eg, `StreamWriter.WriteLine()` vs. `StreamWriter.WriteLineAsync()`), you can use `await` to switch your code to use asynchronous operations, gaining all of the scalability benefits of non-blocking IO without any of the complexity.

##Where do asynchronous operations come from?

The point of an asynchronous operation is to wait for something to happen without wasting any threads.  For example, if you're waiting for a web service to send you a reply, you can use an asynchronous HTTP client to wait for that reply and release the thread you were running on to do other things while you wait.  To make this happen, the operating system provides an asynchronous networking API that will wake up and call your asynchronous continuation when a response arrives from the network card.

In other words, an operation can be made asynchronous if it simply waits for something to happen elsewhere, rather than actively computing something.  Operations like reading or writing from a hard disk or network, or waiting 5 seconds, are all inherently asynchronous; they do not involve any direct work beyond sending a request to the hard disk or network card, or setting a timer interrupt.  

By contrast, operations like adding a million numbers, or encrypting data, are _not_ asynchronous.  They may take a long time, but all of that time is spent actively computing something with the CPU, so you can't release your thread and wait for something to happen on its own.  (if you have a separate chip to perform cryptographic operations, this is not true)

For more details about this distinction, see [part 1 of this series](/2014-12-23/parallelism-async-threading-explained).

Therefore, you cannot use C#'s `async` keyword to create a new asynchronous operation; you can only create an asynchronous operation if you have some external event to wait for.  

#So what are async methods good for?
`async` methods are good for _composing_ existing asynchronous operations &ndash; calling multiple operations in sequence and using the results.  All of the complex promise code described in my previous post can be implemented much more easily using `await`.

For example, if you wanted to find out which of two places was warmer, you could write the following asynchronous code by hand:

```csharp
var client = new HttpClient();

var placeTasks = new[] {
	client.GetAsync("https://api.weather.example.com/Locations/" + Uri.EscapeUriString("New York, NY")),
	client.GetAsync("https://api.weather.example.com/Locations/" + Uri.EscapeUriString("Seattle, WA"))
};
	
	// Wait for both tasks to finish - for the response headers to start arriving
Task.WhenAll(placeTasks).ContinueWith(task =>
	task.Result.Select(response => response.Content.ReadAsStreamAsync())
	// Wait for the response bodies
).ContinueWith(tasks => {
	var xmlBodies = tasks.Result.Select(t => XDocument.Parse(t.Result));
	var hottest = xmlBodies
		.Select(x => (decimal)x.Descendants("Current").Single().Element("Temperature"))
		.Max();
});
```

Using `await` makes this much simpler:

```csharp
// Wait for both tasks to finish - for the responses to start arriving
var responses = await Task.WhenAll(placeTasks);

// Wait for the response bodies
var bodies = await Task.WhenAll(responses.Select(response => response.Content.ReadAsStreamAsync()));

var xmlBodies = bodies.Select(t => XDocument.Parse(t.Result));
var hottest = xmlBodies
	.Select(x => (decimal)x.Descendants("Current").Single().Element("Temperature"))
	.Max();
```

Behind the scenes, the compiler will transform `async` methods into a series of promise callbacks, storing your local variables in a mutable closure class.  (It's actually more complicated than that; Jon Skeet explained exactly how it works in his [Eduasync blog posts](http://codeblog.jonskeet.uk/2011/05/08/eduasync-part-1-introduction/))

This feature is most helpful for more complicated code, especially when consuming operations in sequence.  For example, the complicated `reduce()` loop (from my [previous blog post](/2015-06-10/advanced-promise-usage)) to asynchronously process an array of items in sequence becomes much simpler:

```csharp
foreach (var item in items) {
	await SomeFunctionAsync(item);
}
```

To gather the results, you can simply add them to a list: 

```csharp
var results = new List<T>();
foreach (var item in items) {
	results.Add(await SomeFunctionAsync(item));
}
```

<!-- Due to a Markdown bug, I need an element between the code block and the header. -->
#Pitfalls

The most common mistake with `async` methods is `async void`.  An `async` method is required to return one of `void`, `Task`, or `Task<T>`.  If your function doesn't return a value, it can be tempting to make it return `async void`.  The problem with this option is that it makes it impossible for the caller to find out when the asynchronous portion of the method is finished, or to handle any errors that are thrown asynchronously.  As I explained in [part 2](/2015-01-04/async-method-patterns), in order to wait for an asynchronous operation to finish, it must return a promise.

The only correct place to use `async void` is event handlers.  Since the code that raised the event doesn't care when you finish handling it, there is nothing wrong with hiding the promise from it.  (In fact, event handlers _must_ be `async void`, since event delegates are declared as returning `void`.)
