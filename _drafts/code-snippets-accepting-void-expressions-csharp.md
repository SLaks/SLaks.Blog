---
title: "Code Snippets: Accepting void expressions in C#"
layout: "post"
categories: [C#, code-snippets]
---

_This post is part of a [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

There are many reasons to embed or run snippets of C# code.  Templating languages like Razor

```csharp
void Accept(Action x) {
    x();
}
void Accept<T>(Func<T> x) {
    var value = x();
    Console.WriteLine(value);
}

Accept(() => Console.Beep());
Accept(() => 42);
```