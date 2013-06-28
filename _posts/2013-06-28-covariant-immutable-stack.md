---
title: "Immutability, part 2.5: Adding covariance to the immutable stack"
layout: "post"
categories: [C#, variance, oop, thread-safety, immutability]
---

[Last time]({% post_url 2013-06-23-creating-immutable-stack %}), I showed how to create a simple immutable stack.  However, this stack is not [covariant](http://msdn.microsoft.com/en-us/library/dd799517.aspx).  Ideally, we should be able (for example) to implicitly convert `IStack<string>` to `IStack<object>`.

Most collection types cannot be co-variant.  Had `List<string>` been convertible to `List<object>`, you would then be able to add an `int` (or any other type) to the converted `List<object>`, even though it can't fit in `List<string>` (which the casted instance actually is).  To be precise, covariance is only type-safe for immutable types.

Since our `Stack<T>` class is immutable, we should be able to simply change it to <code>public interface Stack&lt;<b>out </b>T></code> and get co-variance instantly.

In practice, it's not so simple.  Even though the class is immutable, it still has a method that takes `T` as a parameter (namely, `Push(T)`).  Even though the method doesn't mutate anything, it still wouldn't be type safe:

```csharp
IStack<string> stringStack = PersistentStack<string>.Empty;
IStack<object> objectStack = stringStack;
objectStack = objectStack.Push(4);
Console.WriteLine(objectStack.GetType());	// This is PersistentStack<string>
```

This isn't safe because covariance is a property of the _interface_, not the implementing class.  Even when casted to `IStack<object>`, the instance is still an `IStack<string>`, and therefore its `Push(T)` method can still only take a string.  Similarly, the return value of `Push()` would still have been `IStack<string>`, which would be implicitly converted to `IStack<object>` to fit in the variable.

The actual behavior that we want for `Push()` is a little more subtle.  If we have an `IStack<string>`, we should be able to push _any_ object onto it, resulting in a new stack whose type is the least common ancestor between the type of the original stack and the type that we pushed.  For example, `Stack<Button>.Push(new TextBox())` should return a `Stack<Control>`.  

Therefore, the desired signature for `Push()` would look like this:

```csharp
public interface IStack<out T> {
	IStack<U> Push<U>(U element) where T : U;
	// Other members...
}
```
In other words, `Push()` can return a stack of any supertype of our element type.  Unfortunately, this won't work; C# (unlike Java) does not support _upper_ bounds on a generic type parameter.  You can write `X<T> where T : SomeType`, but not `X<T> where SomeType : T`.  
Java, by contrast, would allow us to write `Stack<U> <U super T> push(U element);`.

However, all is not lost.  Although we can't constrain `Push()` based on the parent type's type parameter, we can constrain it on _its own_ type parameter.  Specifically, we can make it an extension method:

```csharp
public static IStack<U> Push<T, U>(this IStack<T> stack, U element) where T : U;
```

In fact, once we move it out of the class itself, we don't even need a second type parameter.  Since the stack is covariant, the `IStack<T>` parameter is convertible to `IStack<U>`, so we can simplify it to take just one generic parameter:

```csharp
public static IStack<U> Push<U>(this IStack<U> stack, U element);
```

This way, you can write `stringStack.Push(new object())`, and the compiler will infer `U` to be `object`, then covariantly convert the `IStack<string>` to `IStack<object>` to pass as the first parameter.

Note that C#'s type inference algorithm will not attempt to find the least-common-ancestor when presented with two types (unless one is a descendant of the other), so you would need to specify the type parameter explicitly: `buttonStack.Push<Control>(new TextBox())`.  Rather, it can only infer ancestral relationships can be inferred, such as `buttonStack.Push(new Control())`.

The only remaining problem is that the extension method must be specific to one implementation.  It can extend (and return) the `IStack` interface, but it must create a specific implementing type.  There is no elegant type-safe way for it to return whatever implementing type was passed to it.

Here is the code for a fully covariant immutable stack:

```csharp
public interface IStack<out T> {
	IStack<T> Pop();
	T Peek();
	bool IsEmpty { get; }
}

public static class PersistentStackExtensions {
	public static IStack<TNew> Push<TNew>(this IStack<TNew> stack, TNew element)  {
		return new PersistentStack<TNew>.LinkNode(stack, element);
	}
}

public abstract class PersistentStack<T> : IStack<T> {
	public static readonly PersistentStack<T> Empty = new EmptyNode();

	private class EmptyNode : PersistentStack<T> {
		public override IStack<T> Pop() {
			throw new InvalidOperationException("Stack is empty");
		}
		public override T Peek() { 
			throw new InvalidOperationException("Stack is empty");
		}
		public override bool IsEmpty { get { return true; } }
	}

	internal class LinkNode : PersistentStack<T> {
		readonly IStack<T> previous;
		readonly T element;
		
		public LinkNode(IStack<T> previous, T element) {
			this.previous = previous;
			this.element = element;
		}

		public override IStack<T> Pop() {
			return previous;
		}
		public override T Peek() { return element; }
		public override bool IsEmpty { get { return false; } }
	}
	public abstract IStack<T> Pop();
	public abstract T Peek();
	public abstract bool IsEmpty { get; }
}

IStack<string> stringStack = PersistentStack<string>.Empty;
stringStack = stringStack.Push("A").Push("B");

IStack<object> objectStack = stringStack.Push<object>(42);
	
while (!objectStack.IsEmpty) {
	Console.WriteLine(objectStack.Peek());
	objectStack = objectStack.Pop();
}
```

The private `PersistentStack<T>.LinkNode` class now needs to be `internal` so that the extension method can instantiate it.

_Next time: Swapping immutable objects without losing thread-safety_