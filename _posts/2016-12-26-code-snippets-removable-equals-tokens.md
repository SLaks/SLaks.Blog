---
title: "Code Snippets: Removable = Tokens"
layout: "post"
categories: [C#, code-snippets]
---

<center><em>Or, torturing compilers for fun <strike>and profit</strike>.</em></center>

I recently tweeted an interesting C# challenge:

<div class="twitter-frame">
	<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">C# Quiz: Construct a valid program which remains valid when a single = token is removed.</p>&mdash; Schabse Laks (@Schabse) <a href="https://twitter.com/Schabse/status/811644097505193984">December 21, 2016</a></blockquote>
	<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>

This has enough solutions to warrant a blog post, explaining how each answer works.

Note that you must remove an `=` character _which is parsed as a single token_; that means you can't remove an `=` from a comment (which is not a token at all), or one which is merely part of a larger token like `>=`, `=>`, `==`, or `!=`.

The `=` token is valid in 2 places: Assignments and variable (or similar) initializers.  We must construct situations where the 2 tokens surrounding the `=` token remain valid in juxtaposition once it's removed.  Since there aren't many places allow two identifiers in sequence, this is not easy.

First, there are 3 simple answers:

## 1: The `Color Color` trick

```csharp
int Int32;
void M() {
    Int32 = Int32;
}
```

This utilizes the [Color Color case](https://github.com/ljw1004/csharpspec/blob/gh-pages/expressions.md#identical-simple-names-and-type-names); if an identifier can refer to either a typename or a simple name in the same scope, it's treated as both, and can be used as either meaning.

With the `=` sign, this is an assignment, and both `Int32`s refer to the field.  Without the `=` sign, it's a variable declaration; the first `Int32` refers to the `System.Int32` type, and the second is a variable name (hiding the field).

### Variant: Casting
Using the same `Int32` declaration as above, you can also construct a cast:

<div class="small"></div>
```csharp
int x = (Int32) = 0;
```
This works because of what appears to be a bug in the compiler; the left side of an assignment expression can be wrapped in parentheses.  Without the `=`, this becomes a cast.

Since the cast alone is not valid as a statement, I need to wrap it in an assignment.  This also means the `Int32` variable must be of a type convertible to the `Int32` type (since both are assigned to `x` here); the previous answer also works with `string Int32` or any other type.

## 2: Collapsing 2 tokens to 1.

_Credit to [Josh Varty](https://twitter.com/ThisIsJoshVarty/status/811646571825631232) for this solution_

<div class="small"></div>
```csharp
int x=3;
```

This is a clever cheat; instead of merely removing a token, it utilizes the missing whitespace to combine the surrounding tokens into a single name.

## 3. Invocation expression

<div class="small"></div>
```csharp
Action<int?> a = null;
a = (null);
```

This trick works because variables of delegate type are both callable and (unlike functions) assignable.  By wrapping the right side of the assignment in parentheses, this becomes a valid function call when the `=` is removed.

Making this compile is a bit tricky; the right side must be convertible to both the delegate type and its parameter.  `null` is the simple way to meet that requirement (and will come up again in more-complex answers).  To avoid the `null`, you must declare your own delegate that accepts itself as a parameter; this is impossible to achieve with the built-in `Action<T>` delegates (since you can't write `Action<Action<Action<...>>>` forever).  [_example_](http://tryroslyn.azurewebsites.net/#b:master/f:r/MYGwhgzhAEDC0G8BQBIAJgUxBg5mALhtAG4D2AlmtACIAU10aAlANxLQc2NuckVUBZWk0TtenKgF5otZi2hiOAXyRKgA)

### Variant: `ref` return
```csharp
ref Action<int?> M() => ref M();
void M2() {
    M () = (null);
}
```

I can also do this using another new C# 7 feature, [ref returns](https://blogs.msdn.microsoft.com/dotnet/2016/08/24/whats-new-in-csharp-7-0/#user-content-ref-returns-and-locals), which allow a parenthesized expression on the left hand side of an assignment.

This answer calls `M()` whether the `=` token exists or not.  With an `=`, it assigns `null` to its return value (by reference).  Without the `=`, it calls that return value, passing `null` as a parameter.

----

The remaining answers are much more complicated, relying on clever ways to combine or abuse language features new to C# 6 and 7. 

## 4. Lambda expressions vs. Expression-bodied methods
<div class="small"></div>
```csharp
Func<int?> C = () => null;
```

This uses the `=` sign to switch between two entirely different declaration syntaxes; variables and expression-bodied methods.

With the `=`, this is a class field of type `Func<int?>`, initialized to a simple lambda expression.  Removing the `=` changes it to a method whose _return_ type is `Func<int?>`, with an [expression body](https://github.com/dotnet/roslyn/wiki/New-Language-Features-in-C%23-6#expression-bodied-function-members) that returns `null`.

Like the previous example, I use `null` to be convertible to both the delegate type itself (for the field initializer) and its return value (for the expression-bodied method); I could also have used a `delegate D D();` and returned `C` itself.

## 5. Splitting a class member in half
```csharp
class async { 
    Func<int, Task<int?>> A { get; } = async(int B) => new int?();
}
```

Here's where the real evil comes in to play.  C# 6 introduces [auto property initializers](https://github.com/dotnet/roslyn/wiki/New-Language-Features-in-C%23-6#initializers-for-auto-properties).  This is the first time that the assignment operator can follow something other than a name (or array access), giving me new horizons to explore in its removal.

In particular, the assignment here is optional, and, when it's omitted, no semicolon is needed to terminate the expression.  This opens up new opportunities that aren't possible in methods because of those pesky semicolons.  All I need to do is create an initializer expression that becomes a valid class member declaration once the `=` is removed.

To do this, I turn to the powers of contextual keywords.  When parsed as an expression, the right hand side of this initializer is an `async` lambda expression.  Once I remove the `=`, it becomes an expression-bodied constructor (new to C #7) for a class named `async`.  The body after the `=>` must be valid as both a lambda that returns the type declared for `A` and as a statement (since constructors have no return value), so `=> null` won't work.  The simplest expression which is valid as a statement and returns a value is `new blah()`, so I use that.

### Would-be variant:
<div class="small"></div>
```csharp
class async {
    Func<int, Task<int?>> A { get; } = async B => null;
}
```

In principle, I should be able to replace the expression-bodied constructor with a simple [expression-bodied property](https://github.com/dotnet/roslyn/wiki/New-Language-Features-in-C%23-6#expression-bodies-on-property-like-function-members), declaring a property of type `async`.  Here, the body after the `=>` is a property getter, so I can return `null` like I usually do.

However, due to a [bug](https://github.com/dotnet/roslyn/issues/16044) in the parser, expression-bodied properties cannot have a type named `async`, so this doesn't actually compile.


## 6. Tuple Deconstruction
```csharp
Action<int, int> var(int a, int b) => null;
int x, y;
void M() {
    var (x, y) = (1, 2);
}
```

This is similar to #3 and its variant, taking advantage of another new C# 7 feature, [tuple support](https://blogs.msdn.microsoft.com/dotnet/2016/08/24/whats-new-in-csharp-7-0/#user-content-tuples).  Like the previous answer, this adds new possibilities to the `=` operator; the left-hand side can now be a parenthesized list.  Without the `=`, the parenthesized list is not legal as-is, so we need to turn it into a parameter list for a method call.

With the `=`, this is a combination of a tuple literal and a deconstructing variable declaration.  Removing the `=` completely rewrites the parse tree, turning it into a chained call to a function named `var` with two parameters, followed by a call to its returned delegate with two more parameters.  `x` and `y` must be declared separately as fields so that they can be passed as parameters without `=` but be declared as variables with `=`.

You can also replace the tuple literal with an explicit tuple construction ([demo](http://tryroslyn.azurewebsites.net/#b:master/f:r/K4Zwlgdg5gBAygTxAFwKYFsDcAoAxgGwEMQQYBhGAb2xlpgEFdkwB7CAHgBVgAHfVdpGQAaIQD4xMAG6EATgAohMQsJhKARgEoYAXkkRg+fDjpqIyGAA9VCE3SkswAExgBZeduqnTM2THnWMAjaOv7cfKgAdGSyqIRo8gCMqgBMmpp2tAC+2FlAA)), but the method must still be named `var`, since deconstructing assignment is only valid with `var`.


## 7. Local functions

```csharp
Func<Task<int>> Int32;
Int32 = async() => 7;
```

This is a cleverer variant of #4, using the `=` to turn a method declaration into an assignment.  This time, I combine expression-bodied methods with C# 7's new [local functions](https://blogs.msdn.microsoft.com/dotnet/2016/08/24/whats-new-in-csharp-7-0/#user-content-local-functions).

Local functions allow me to bring the expression-bodied method trick into statement context, allowing me to turn it into a statement rather than a declaration.  This gives me more options to make it stay when adding the `=`.

This example starts as `async` lambda expression assigned to a variable named `Int32` (which therefore must be of a delegate type that returns a `Task`).  Removing the `=` turns this into a (non-`async`) local function named `async` that returns `Int32`.  Like many of the other answers, this utilizes the `Color Color` trick to allow `Int32` to be both a return type and an assignable name.  Unlike #4, this doesn't change the expression from a lambda to a return value, so I don't need to return `null` to be compatible with both variants.

**Bonus challenge**: Construct a valid C# program with 2 `=` tokens that remains valid when either or both of them are removed.

**Disclaimer:** No compilers were ([permanently](https://github.com/dotnet/roslyn/issues?utf8=%E2%9C%93&q=16068%20OR%2016098%20OR%2016044%20author%3Aslaks)) harmed in the writing of this blog post.
