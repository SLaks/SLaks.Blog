---
title: "The Perils of Smart Rename, or, How to make the Roslyn team cry"
layout: "post"
categories: [C#, Roslyn]
---

One of the cool features in the new [Roslyn](http://msdn.com/roslyn) editor is the new Rename refactoring.  Unlike the old Rename from VS2012, Roslyn's rename takes full advantage of the semantic model from the Roslyn compiler to catch all potential conflicts that might result.  It will even automatically fix them where possible.

For example:

```csharp
class MyClass {
	int state;
	void MyMethod() {
		int x = state;
	}
}
```

If you rename `x` to `state`, Roslyn  will automatically change the initializer to `int state = this.state` so that it still refers to the field.

Similarly:

```csharp
class BaseClass {
	public virtual void DoSomething() { }
}
class DerivedClass : BaseClass {
	static void DoOtherThing() { }
	void MyMethod() {
		DoSomething();
	}
}
```

Here, renaming `DoSomething()` to `DoOtherThing()` will change the method call in the derived class to `BaseClass.DoSomething()` to make sure it still references the correct method.
       
Some conflicts cannot be resolved.  For example:

Given that Roslyn already knows what everything in your code means, this would seem like a simple feature to add.  However, the sheer number of different corner cases that can occur belies that assumptions.

Symbolic rename is probably the most fiendishly difficult feature in the entire Roslyn project.

Here are some of the more diabolical corner cases that make this feature so complicated:
https://twitter.com/jasonmalinowski/status/436205667947266048
https://twitter.com/jasonmalinowski/status/436209922934460416

Attribute suffix
Duck-typed pattern
Max() in VB query
Main()
Aliases
Rename String
Rename to `var`

```csharp
namespace Outer {
	using New = Old;
	namespace B {
		class C { New x; }
		static class Old { }
		static class Outer { }
		static class ExtraClass { }	// Rename to New
	}
	class Old { }
}
static class Old { }
```
