---
title: "Code Snippets: Conditional Casting"
layout: "post"
categories: [C#, casts, code-snippets]
---

When writing C#, you will occasionally need to check whether an object is an instance of a certain type (eg, `Button`), and use part of that type if it is.

This is most commonly written as

```csharp
object x = ...;
if (x is Button) {
	var b = (Button) x;
	// Use b...
}
```

This 

A clever and unreadable alternative is

```csharp
for (var b = x as Button; b != null; b = null) {
	// Use b...
}
```

This works by

_Side note:_ This should generally be avoided; instead, consider using a virtual method on the base class, or a visitor pattern.