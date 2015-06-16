---
title: "Code Snippets: Impossible Code"
layout: "post"
categories: [C#, code-snippets]
---

_This post is part of a [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

I recently set out to create snippets of code that have nothing inherently wrong with them, but can never appear in a valid program.


#void expressions
The first example is an expression of type `void`.  This expression is completely fine, except that there is no way to _use_ an expression of type `void` anywhere.

The only valid place that the type `void` can appear in C# is as a method return type; thus, the only way to make an expression of type `void` is a method call.  Method calls are legal as expression statements, so that is perfectly fine.

However, there is one feature in the language that lets you call an expression with an arbitrary return type, in a syntax which is _not_ legal as an expression statement: LINQ queries.

```csharp
class Impossible {
    public static void Select(Func<int, int> a) { }
}

from x in Impossible select 1;
```

Any attempt to use this query will result in either "CS0201: Only assignment, call, increment, decrement, and new object expressions can be used as a statement" or "CS0815: Cannot assign void to an implicitly-typed variable".  (except for [a bug](https://github.com/dotnet/roslyn/issues/1830) in the RC release of the Roslyn compiler)

_Side note_: I need to take the unusual approach of making a LINQ query against a static method on a type to prevent people from making it compile by adding a matching extension method.

#Impossible accessibility
A much simpler approach is to form a statement that uses `internal` types from two different assemblies, so that there is no project that it could legally appear in:

```csharp
// In A.dll:
public class Base {
    internal static void Method() { }
}

// In B.dll:
public class Container {
    public class Derived : Base { }
}

Container.Derived.Method();
```

#Impossible overload resolution
A more interesting approach is to make two overloads of a generic method such that it is impossible to distinguish between them:


```csharp
void Method<T, U>(T p) { }
void Method<T, U>(U p) { }
```

There is no way to call either of these methods with the same type for both generic type parameters (eg, `Method<int, int>`).

Ordinarily, C# has a number of ways to help disambiguate between generic overloads.  You can cast ambiguous parameters to the exact argument type of the desired overload.  You can explicitly specify type parameters.  You can call the method through a specific qualifier (to disambiguate between static and instance methods, or between methods inherited from a base class).  You can even passed named parameters if the two overloads have different parameters names.

However, these methods are identical in all of these regards, leaving no way to tell the compiler which one you want to call.  (note that it is possible to call them at runtime using Reflection)

#Generic constraint conflict

Another option is to create a method with conflicting generic type constraints, such that there is no possible type that will satisfy the constraints.  Ordinarily, the compiler will not let you do that; a type parameter cannot be constrained to two different classes.  However, you can bypass this restriction using more generics:

```csharp
class Container<T, U> {
	public void Method<Z>() where Z : T, U {}
}
```

It is impossible to call `Method` on any instance parameterized with classes that do not inherit one another (eg, `Container<Exception, Type>`).  Unlike the previous example, it is _completely_ impossible to call this method on such an instantiation, even with reflection &ndash; there is no type that is valid value for `Z`.


#Impossible inheritance
Any of these impossible methods can also be used to make a class that can never have any instances, by making an abstract method that cannot be implemented:

```csharp
abstract class Base<T, U> {
    public abstract void Method(T x);
    public abstract void Method(U x);
}
abstract class Impossible : Base<int, int> { }
```

Any attempt to create a concrete non-`abstract` subclass of `Impossible` will result in "CS0462 The inherited members 'Base<T, U>.Method(T)' and 'Base<T, U>.Method(U)' have the same signature in type 'Impossible', so they cannot be overridden".

```csharp
abstract class Base<T, U> {
    public abstract void Method<Z>() where Z : T, U;
}
abstract class Impossible : Base<Type, Exception> { }
```

Here, implementing `Impossible` will give "CS0455 Type parameter 'Z' inherits conflicting constraints 'Exception' and 'Type'".

#Interface method conflict

```java
interface A {
    int method();
}
interface B {
    long method();
}
final class C implements A, B { }
```

It is impossible to implement `C`.  Because Java does not support explicit 

_Side note:_ I need to add `final` because otherwise, making `C` abstract would let it compile without implementing the method.
