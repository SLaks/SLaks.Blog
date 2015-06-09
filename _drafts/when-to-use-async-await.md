---
title: "When should I use async/await?"
layout: "post"
categories: [async, multi-threading, concepts, C#]
---

C# 5's flagship new feature is the new [`await` keyword](http://msdn.microsoft.com/en-us/library/hh191443), which lets you use asynchronous functions without dealing with messy callbacks and closures.  However, the wealth of possibilities opened by this feature has left many developers confused about when to make `async` methods and when not to.

#Non-blocking IO
The `async` keyword does not _create_ asynchrony; instead, it allows you to call existing asynchronous methods easily.  If your code isn't calling any existing `*Async()` methods (which return `Task` or `Task<T>`), `async` won't do any good for you.  However, if you have the option of calling synchronous or asynchronous versions of an operation (eg, `StreamWriter.WriteLine()` vs. `StreamWriter.WriteLineAsync()`), you can use `await` to switch your code to use asynchronous operations, gaining all of the scalability benefits of non-blocking IO without any of the complexity.

##Where do asynchronous operations come from?

The point of an asynchronous operation is to wait for something to happen without wasting any threads.  For example, if you're waiting for a web service to send you a reply, you can use an asynchronous HTTP client to wait for that reply and release the thread you were running on to do other things while you wait.  To make this happen, the operating system provides an asynchronous networking API that will wake up and call your asynchronous continuation when a response arrives from the network card.

In other words, an operation can be made asynchronous if it simply waits for something to happen elsewhere, rather than actively computing something.  Operations like reading or writing from a hard disk or network, or waiting 5 seconds, are all inherently asynchronous; they do not involve any direct work beyond sending a request to the hard disk or network card, or setting a timer interrupt.  

By contrast, operations like adding a million numbers, or encrypting data, are _not_ asynchronous.  They may take a long time, but all of that time is spent actively computing something with the CPU, so you can't release your thread and wait for something to happen on its own.  (if you have a separate chip to perform cryptographic operations, this is not true)

Therefore, you cannot use C#'s `async` keyword to create a new asynchronous operation; you can only create an asynchronous operation if you have some external event to wait for.  

#So what are `async` methods good for?
`async` methods are good for _composing_ existing asynchronous operations &ndash; calling multiple operations in sequence and using the results.

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
var client = new HttpClient();

var placeTasks = new[] {
	client.GetAsync("https://api.weather.example.com/Locations/" + Uri.EscapeUriString("New York, NY")),
	client.GetAsync("https://api.weather.example.com/Locations/" + Uri.EscapeUriString("Seattle, WA"))
};

// Wait for both tasks to finish - for the responses to start arriving
var responses = await Task.WhenAll(placeTasks);

// Wait for the response bodies
var bodies = await Task.WhenAll(responses.Select(response => response.Content.ReadAsStreamAsync()));

var xmlBodies = bodies.Select(t => XDocument.Parse(t.Result));
var hottest = xmlBodies
	.Select(x => (decimal)x.Descendants("Current").Single().Element("Temperature"))
	.Max();
```

#What isn't


```csharp
```
