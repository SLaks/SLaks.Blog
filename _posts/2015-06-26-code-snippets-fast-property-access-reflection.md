---
title: "Code Snippets: Fast Runtime Property Access with Reflection"
layout: "post"
categories: [C#, reflection, code-snippets]
---

_This post is part of a [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

Reflection is great for accessing all properties (or an arbitrary property named at runtime) of an arbitrary type.  However, Reflection has performance costs which can be unacceptable in critical codepaths.  Instead, you can add an upfront cost and create generic delegates to read or write such properties without any overhead at all (depending on what you're doing with the values, you can even avoid boxing). 

The typical goal for this kind of code is to get the value of a property with the specified name.

The naive (and slowest) way to do this is straight-up reflection:

```csharp
string name
object o;

object value = o.GetType().GetProperty(name).GetValue(o);
```

This does all of the work of locating the property and dynamically invoking its getter on every call.  You can improve this by caching each `PropertyInfo`:

```csharp
var properties = new Dictionary<string, PropertyInfo>();

PropertyInfo property;
if (!properties.TryGetValue(name, out property))
	properties.Add(name, (property = o.GetType().GetProperty(o)));
value = property.GetValue(o);
```

(if multiple threads are involved, you'll need either `[ThreadStatic]` or a `ConcurrentDictionary`)

However, this still repeats the work of dynamically invoking the getter method.  You can eliminate this by creating a delegate that points to the get method.  Creating the delegate still involves some costly reflection, but once it's created, calling it will be as fast as calling any other delegate.

```csharp
var getters = new Dictionary<string, Func<T, object>();

Func<T, object> getter;
if (!getters.TryGetValue(name, out getter)) {
	getter = (Func<T, object>)Delegate.CreateDelegate(
		typeof(Func<T, object>),
		typeof(T).GetProperty(name).GetMethod
	);
	getters.Add(name, getter);
}

T o;
value = getter(o);
```

This uses [delegate return type covariance](https://msdn.microsoft.com/en-us/library/ms173174) to create a `Func<..., object>` from a getter method that returns any more-derived type.  This feature actually predates generic covariance; it will work even on .Net 2.0.

This approach has some caveats.  This can only work if you know the type of the objects you're operating on at compile-time (eg, in a generic method to bind or serialize parameters).  If you're operating on `object`s at compile time, this cannot work, since such a delegate wouldn't be type-safe.  

This also won't work for properties that return value types.  Variance [works because](http://stackoverflow.com/a/12454932/34397) the runtime representation of the types are completely identical, so that the JITted code doesn't know or care that the actual type parameter is different.  Value types require different codegen than reference types, so this cannot begin to work.

To solve these problems, you can do actual runtime code generation, using the ever-handy `Expression<T>`.  Specifically, you need to create an expression tree that casts an `object` parameter to `T` (if you don't know the actual type at compile time), then boxes the result of the property into an `object` (if it's a value type).

```csharp
var param = Expression.Parameter(typeof(T));
getter = Expression.Lambda<Func<T, object>>(
	Expression.Convert(
		Expression.Property(param, name),
		typeof(object)
	),
	param
).Compile();
```

The `Expression.Convert()` node will automatically generate a boxing conversion if `T` is a value type, making this work.  This whole block is only necessary if `T` is a value type; if it's a reference type, you can skip the entire runtime codegen phase with the previous example.
