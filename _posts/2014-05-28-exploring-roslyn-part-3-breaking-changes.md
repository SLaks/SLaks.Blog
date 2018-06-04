---
title: "Exploring Roslyn, part 3: Breaking Changes"
layout: "post"
categories: [Roslyn, .net, visual-studio]
---

[Last time]({% post_url 2014-05-21-exploring-roslyn-part-2-inside-end-user-preview %}), I talked about what the Roslyn End-User Preview does and how it works.  This time, I'll talk about some subtle breaking changes in the compiler.

The C# & VB teams have a very high bar for backwards compatibility; they try extremely hard to make sure that all of your existing code will compile identically in Roslyn.  However, in any project as large as a compiler, there are bound to be some changes in the way compilation works.  Some of these are flaws in the old compiler, for which Roslyn's fixes can subtly break existing code; some of these are side-effects of the way the new pipeline works which were deemed not worth fixing.  All of these changes are in extremely subtle corner cases, and should not affect most normal codebases.

Breaking changes come in two varieties: Forward-breaking changes, meaning that code that worked pre-Roslyn doesn't work with Roslyn, and backward-breaking changes, meaning that code that works with the Roslyn compiler doesn't work with the old compiler (these can cause problems with open source projects if different people use different VS versions).

Obviously, all of the new language features in C# 6 are backwards-breaking changes; they will never work with older compilers.  However, there are some more subtle changes which can prevent projects from being compiled without Roslyn even if they don't use any new features.

# Lifting variables in iterator methods
When you write an iterator method (using `yield return`), the compiler will transform your method into a class which implements `IEnumerable<T>`, turning your actual code into a state machine inside `MoveNext()`.  (See [Jon Skeet's blog post](https://csharpindepth.com/articles/chapter6/iteratorblockimplementation.aspx) for a thorough explanation.)

Local variables in your method become fields in the iterator class, so they can be persisted across calls to `MoveNext()`.  The old compiler would always lift every single local variable to a field, even if it's never used across a `yield return` boundary (meaning that it doesn't need to stick around between `MoveNext()` calls).  The Roslyn compiler is smarter, and only lifts locals when it needs to (if the local is used both before and after a `yield return`).

This is a breaking change in both directions.  If your pre-Roslyn code declares something like a timer or file handle in an iterator (and doesn't use it later), which it expects to survive until the iterator itself is collected, compiling with Roslyn will allow it to be GC'd much earlier that it would have been with the old compiler.  To fix this, simply add a `GC.KeepAlive()` call at the bottom of the iterator.  Since it is now used on both sides of the `yield return`, the compiler will be forced to lift it into a field in the iterator.

This can also be a backwards-breaking change, for two reasons.  Most obviously, if your Roslyn code uses a very large object in only one place in an iterator, compiling it with the native compiler will cause that object to last much longer; potentially leaking large amounts of memory if your iterators are long-lived (which can happen in surprising ways with LINQ queries).

More subtly, this means that code compiled with the native compiler can load types earlier than it would have with Roslyn.  This [bit me](https://github.com/SLaks/Ref12/commit/2c52df7be397c052980bf91d2bcc6a90eae9c926) in [Ref12](https://visualstudiogallery.msdn.microsoft.com/f89b27c5-7d7b-4059-adde-7ccc709fa86e), where I had an iterator that used a type in an [unversioned assembly](/2014-02-26/extending-visual-studio-part-5-dealing-with-unversioned-assemblies) that I loaded using a `AssemblyResolve` handler.  With Roslyn, it worked fine.  Without Roslyn, that type ended up in a field in the iterator class, so MEF tried to load the type when inspecting the assembly (through `Assembly.GetTypes()`), and the extension refused to load.

## Demo
```csharp
static void Main() {
	var e = M();
	e.MoveNext();
	GC.Collect();
	GC.WaitForPendingFinalizers();
	
	e.MoveNext();
	GC.Collect();
	GC.WaitForPendingFinalizers();
}

static IEnumerator M() {
	var a = new Alerter();
	a.ToString();	// Prevent the optimizer from removing the variable entirely
	Console.WriteLine("Before return");
	yield return null;
	Console.WriteLine("After return");	
}
class Alerter {
	~Alerter() { Console.WriteLine("Destroying!"); }
}
```

When compiled with the native compiler, this code will print
 > Before return  
 > After return  
 > Destroying!

Since the `Alerter` instance is stored as a field in the iterator, it cannot be collected until the iterator is finished.

With Roslyn, it prints
 > Before return  
 > Destroying!  
 > After return

Since the variable is not referenced again after `yield return`, Roslyn compiles it to a local variable within `MoveNext()`, allowing it to be GC'd while the iterator is still alive.

# Loading indirectly referenced assemblies during compilation
This is a backwards-breaking change only; it will not break any code that already works with the pre-Roslyn compiler.

When compiling code that uses types from a different assembly, the compiler needs to load that assembly to look up the metadata for those types.  It will also load assemblies for types that are related to methods you call directly, such as base types, or parameter types in other overloads.

The native compiler took a heavy-handed approach; it always tried to load every base type and interface for any type that you use.  The Roslyn compiler is more frugal; it will only load base types and interfaces if it needs to.

This means that projects created with Roslyn can easily be missing references that will prevent them from compiling with the native compiler.  In the worst case, there are types like `ExtensionManagerService` (in Visual Studio) that implement COM interop interfaces in private PIAs (Microsoft.Internal.VisualStudio.Shell.Interop.11.0.DesignTime.dll) that are not available outside Microsoft.  With Roslyn, you won't even notice these; the IDE does not show them, and the compiler completely ignores them.  The native compiler, on the other hand, will completely refuse to compile code that uses these types, since it can't load those base interfaces.  This bit me [here](https://github.com/SLaks/Root-VSIX/issues/1).  (The solution is to create your own PIA assembly from the embedded interop types in ILSpy.)

# Overload resolution with conflicting ambiguities
C# 6.0 has some subtle changes in the behavior of overload resolution with optional parameters.  Before Roslyn, if you had a method call that was ambiguous between two overloads, but one of those overloads had additional optional parameters, whereas the other didn't, the native compiler would choose the first overload.

For example:

```csharp
void M(string a) { Console.WriteLine(1); }
void M(Exception a, char c = 'c') { Console.WriteLine(2); }

M(null);	// Prints 1, not 2
```

In Roslyn, this will no longer compile; the compiler will instead complain that it can't figure out which overload to pick.  You can fix this by explicitly casting the initial parameter to the type used in either overload.

Overload resolution is extremely complicated, but Roslyn's behavior appears to be correct according to the spec (&sect;7.5.3.2; emphasis added):

> For the purposes of determining the better function member, a stripped-down argument list A is constructed containing just the argument expressions themselves in the order they appear in the original argument list.

> Parameter lists for each of the candidate function members are constructed in the following way: 

> - The expanded form is used if the function member was applicable only in the expanded form.
> - **Optional parameters with no corresponding arguments are removed from the parameter list**
  
After removing omitted optional parameters, it is clear that neither of these overloads is better, so the ambiguity error is correct.

# Other bugfixes
The Roslyn compiler also fixes a number of minor bugs in the old compiler, rejecting code that was incorrectly accepted by the native compiler (such as the overload resolution example above), or accepting code that the old compiler incorrectly reported an error for.

 - Roslyn will show a warning when comparing a non-null value type to null (eg, `new DateTime() == null`).  
   The native compiler missed this warning for non-primitives  (even though the optimizer collapsed it to a constant `false`). 

 - Roslyn does not allow `is` or `as` to be used with static types (eg, `new object() is BitConverter`).  
   The native compiler compiled this fine (it always evaluated to `false` at runtime).

 - Roslyn allows structs to contain themselves as static nullable fields (eg, `struct MyStruct { static MyStruct? Value; }`). 
   The native compiler incorrectly complained about a cycle in the struct layout.  
   Note that there is currently a [bug](https://roslyn.codeplex.com/workitem/185) in Roslyn that makes this produce invalid IL.

 - Roslyn rejects parentheses around named parameters (eg, `Console.WriteLine((value: 42))`).  
   The native compiler incorrectly allowed this invalid syntax.

 - Roslyn [disallows](https://twitter.com/vreshetnikov/status/428259020437069824) method groups in `is` or `as` operators (eg, `"".Any is byte`).  
   The native compiler allowed this (although it did show a warning), and in fact didn't even check extension method compatibility, allowing crazy things like `1.Any is string` or `IDisposable.Dispose is object`.  Interestingly, the spec explicitly allowed this (&sect;7.10.10); the Roslyn team felt that that was not a good idea.