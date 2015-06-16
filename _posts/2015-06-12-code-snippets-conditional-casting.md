---
title: "Code Snippets: Conditional Casting"
layout: "post"
categories: [C#, casts, code-snippets]
---

_This post is the beginning of a new [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

When writing C#, you will occasionally need to check whether an object is an instance of a certain type (eg, `Button`), and use part of that type if it is.

This is most commonly written as

```csharp
object x = ...;
if (x is Button) {
	var b = (Button) x;
	// Use b...
}
```

This approach is simple and readable.  However, it has an unnecessary performance hit.  .Net casts are not free; every cast instruction must check that the object being casted is in fact convertible to that type.  Casting the same object twice will duplicate that check for no good reason, and [should be avoided](https://msdn.microsoft.com/en-us/library/ms182271).

The recommended pattern for this is to pull the `as` check outside the `if`:

```csharp
var b = x as Button;
if (b != null) {
    // Use b....
}
```

However, this code has the disadvantage of leaking `b` into the containing scope, allowing you to accidentally use it outside the `if` block when it might be null.

A clever (but less readable) alternative is

```csharp
for (var b = x as Button; b != null; b = null) {
	// Use b...
}
```

([Credit](https://twitter.com/jonskeet/status/104281895289888768) to Jon Skeet)

This works by abusing the elements of the `for` loop, and, in particular, taking advantage of the fact that the variable declared in the `for` statement is within its own scope.  The first clause simply declares the `b` variable, and initializes it to be either `null` or the correct type.  After running that, the compiler will immediately run the second clause (the termination condition).  Thus, if `b` is null (if the cast failed), it will exit the &ldquo;loop&rdquo; immediately.  Finally, after the body of the code block, it will run the third clause, setting `b` back to null and ensuring that the loop will not run again.

For simple uses, C# 6 introduces the ideal way to do this with the conditional access operator:

<div class="small"></div>
```csharp
(x as Button)?.Click();
(null as StreamWriter)?.WriteLine();
```

If the cast fails, it will evaluate to null, and the `?.` operator won't do anything.  However, this only helps if you're doing exactly one method call on the casted expression, and does not work for assignments or [event handler registration](https://github.com/dotnet/roslyn/issues/1276).

_Side note:_ This should generally be avoided; instead, consider using a virtual method on the base class, or a visitor pattern.