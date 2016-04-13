---
title: "What is a type?"
layout: "post"
categories: [type-theory, generics]
---

## What is a type?

A type is set of values.  For example, the type `int` in C# and Java is the set of all integers between <code>-2<sup>31</sup></code> and <code>2<sup>31</sup> - 1</code>.  

Type X is &ldquo;convertible&rdquo; to another type Y if its set of values is a subset of Y.  For example, `short` is convertible to `int` because `short` is a strict subset of `int`.  In other words, every possible `short` is also a valid `int`.  `uint`, on the other hand, is not convertible to `int`, because some `uint`s (eg, <code>2<sup>31</sup> + 42</code>) are not valid `int`s.

What about classes?  Obviously, a class is also a type, but how do you define its set of values? 
As far as the compiler is concerned, the type for a class is the simply set of objects whose class is that class or any of its subclasses.  Any object (whether an expression for a compile-time type system or an instance for a runtime type system) knows which class it is an instance of; the type for any class is based on this information.

Separately from this, a class also contains a description of how its objects are laid out in memory (fields & vtable), as well as what its objects can do (method signatures and bodies).  However, this information is not part of the class' type; it is simply a description of objects that are in the type's set.

Similarly, the type for an interface or mixin is the set of objects whose types are declared as inheriting from that interface.  In particular, the type for an interface is _not_ the set of all objects that have methods matching the interface; the following is illegal:


```csharp
interface IAmABird {
	void Fly();
}
class MyAirplane {
	public void Fly() { }
}

IAmABird tweety = new MyAirplane();	// Boom!
```

This would work in a language with a structural type system (such as TypeScript), but most object-oriented languages have nominative type systems.

## Where are type used?
Most languages have a type system that defines how types behave at compile-time and/or at runtime.  The type system determines the type of each value (at runtime) and each expression (at compile time).  
The type system then checks that each operation is valid.  When you assign an expression to a variable, the type system checks that the expression's type is convertible to the variable's type.

In languages like C or C++, the type system exists purely at compile-time.  The compiler checks all function calls, variable assignments, and other conversions to make sure that the types involved are compatible with each-other.

## What kind a type system do?

A type system provides certain features (eg, immutability, generics, null-safety, ...)

A type-safe language guarantees (at compile time) that you will not get any runtime errors in areas that its type system covers.  Depending on the type system, this can include invalid casts, null reference exceptions, threading issues, etc.

A generic type is a function that returns a type.

Classes and types 