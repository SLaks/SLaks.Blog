---
title: "Code Snippets: Verbosity in Type Systems"
layout: "post"
categories: [C#, Javascript, code-snippets]
---

Type systems exist to help the compiler find problems with your code.

They can also make code _much_ more verbose.
Compare these two equivalent functions in C# vs. Javascript:

```csharp
public static T FindMax<T, TProperty>
		(T a, T b, Func<T, TProperty> prop) 
		where TProperty : IComparable<TProperty> {
	return prop(a).CompareTo(prop(b)) >= 0 ? a : b;
}
// 176 characters
```

```js
function findMax(a, b, prop) {
    return prop(a) >= prop(b) ? a : b;
}
// 75 characters
```

_Side note:_, the Javascript version can be made much more usable, though less flexible by accepting a property name instead of a callback:

```js
function findMax(a, b, prop) {
    return prop(a) >= prop(b) ? a : b;
}
```