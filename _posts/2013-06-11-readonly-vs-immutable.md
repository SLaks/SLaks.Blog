---
title: "Immutability, part 1: Read-only vs. Immutable"
layout: "post"
categories: [C#, oop, thread-safety, immutability]
---

A _read-only_ object is an object that does not expose any way to change it.  `ReadOnlyCollection<T>` (returned by `AsReadOnly()`) is a good example).  However, `IEnumerable<T>` is also read-only.  
The important distinction is that read-only objects are allowed to change.  

If you write `list.Add(new Test())`, your read-only collection (which just wraps `list`) will have changed.

Read-only collections are useful for designing safe APIs, where only the owner of the collection is allowed to change it.  
However, it won't do any good for thread-safety.

-----

An **immutable** object is an object that cannot change _at all_, no matter what happens (Reflection doesn't count).  `string` is an excellent example of an immutable class; the value of an existing `string` instance can never change, no matter what happens.  (barring reflection, unsafe code, and certain marshalling tricks)

.Net does not have any built-in immutable collections, but the CLR team [released a library of immutable collection types on NuGet](http://blogs.msdn.com/b/bclteam/archive/2012/12/18/preview-of-immutable-collections-released-on-nuget.aspx).

Truly immutable objects are intrinsically thread-safe.  Since there is no way to modify them, there is no chance that other threads will observe an inconsistent instance.

In summary, there are four kinds of &ldquo;unchangeable&rdquo; things:

 - `readonly` (`ReadOnly` in VB.Net; `final` in Java) fields.  
These fields cannot be re-assigned to point to a different instance.   However, nothing prevents you from mutating the instance pointed to by the field.

 - Read-only classes  
These classes do not expose any APIs to mutate their contents, but can change by other means (typically, by changes made directly to the mutable objects they wrap, or in response to events handled within the class).  
Examples include [`ReadOnlyCollection<T>`](http://msdn.microsoft.com/en-us/library/ms132474.aspx).

 - API-enforced immutable classes  
These classes are not intrinsically immutable, but have an API design that guarantees that mutations will not happen.  In other words, they may contain mutable state, but they will never actually mutate that state.
Examples include delegates (`MulticastDelegate` has an array of handlers, which it will never mutate).

 - Compiler-enforced immutable classes  
These classes only contain `readonly` fields that are themselves immutable.  This means that the compiler will report an error if the developer mistakenly tries to mutate it.  This provides an additional layer of defence against potential mistakes.  
Examples include most `EventArgs` classes.

Finally, an object is _deeply_ immutable (or read-only) if both it and all of its properties are also deeply immutable (or read-only).  In other words, the entire graph of objects reachable from it must be immutable (or read-only).

[_Next time: Creating a simple immutable stack_]({% post_url 2013-06-23-creating-immutable-stack %})