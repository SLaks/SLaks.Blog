---
title: "What is a type?"
layout: "post"
categories: [type-theory, generics]
---

##What is a type?

A type is set of values.  For example, the type `int` in C# and Java is the set of all integers between <code>-2<sup>31</sup></code> and <code>2<sup>31</sup> - 1</code>.  

##Where are type used?
Most languages have a type system that defines how types behave at compile-time and/or at run-time.  The type system determines the type of each value (at runtime) and each expression (at compile time).  
The type system then checks that each operation is valid.  When you assign an expression to a variable, the type system checks that the expression's type is convertible to the variable's type.

##What kind a type system do?

A type system provides certain features (eg, immutability, generics, null-safety, ...)

A type-safe language guarantees (at compile time) that you will not get any runtime errors in areas that its type system covers.  Depending on the type system, this can include invalid casts, null reference exceptions, threading issues, etc.

A generic type is a function that returns a type.

Classes and types 