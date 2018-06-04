---
title: "Immutability, part 2: Creating a simple immutable stack"
layout: "post"
categories: [C#, oop, thread-safety, immutability]
---


[Last time]({% post_url 2013-06-11-readonly-vs-immutable %}), I explained the basic meaning of immutability.  The simplest useful example of an immutable class is an immutable stack.  Immutable stacks work just like regular stacks &ndash; with `Push()`, `Pop()`, and `Peek()` methods &ndash; except that instead of mutating the original instance, `Push()` and `Pop()` return a new, modified, instance.

In code, that looks like

```csharp
public interface IStack<T> {
	IStack<T> Push(T element);
	IStack<T> Pop();
	T Peek();
	bool IsEmpty { get; }
}

IStack<int> myStack = empty;
myStack = myStack.Push(1).Push(2).Push(3);
	
while (!myStack.IsEmpty) {
	Console.WriteLine(myStack.Peek());
	myStack = myStack.Pop();
}
```

Each implementation of this interface would supply a singleton `empty` instance; since they are immutable; there is no need to have more than one empty instance.  Thus, there is no need for a constructor.  Since `Pop()` needs to return the new stack, it cannot return the removed item; therefore, `Peek()` is the only way to get the item.  

As a side benefit, this pattern naturally enables and encourages [fluent interfaces](https://en.wikipedia.org/wiki/Fluent_interface), since each mutation methods returns a new instance.  (eg, `myStack.Push(1).Push(2).Push(3)`)

The naive implementation of this interface would use a list, and copy the list when creating a new stack:

```csharp
public class NaiveStack<T> : IStack<T> {
	private readonly ReadOnlyCollection<T> items;
	private NaiveStack(IList<T> items) {
		this.items = new ReadOnlyCollection<T>(items);
	}
	
	public static readonly NaiveStack<T> Empty 
		= new NaiveStack<T>(new T[0]);
	
	public IStack<T> Push(T element) {
		var list = new List<T>(items);
		list.Add(element);
		return new NaiveStack<T>(list);
	}

	public IStack<T> Pop() {
		if (IsEmpty)
			throw new InvalidOperationException("Stack is empty");
		var list = new List<T>(items);
		list.RemoveAt(list.Count - 1);
		return new NaiveStack<T>(list);
	}

	public T Peek() { return items.Last(); }
	public bool IsEmpty { 
		get { return items.Count == 0; } 
	}
}
```

The problem with this approach is that each mutation requires an O(n) copy to create the list behind the new instance.  This makes `Push()` and `Pop()` awfully slow, and vastly increases the memory footprint until the intermediate instances can be GCd.

To solve these problems, we can design the stack as a [persistent data structure](https://en.wikipedia.org/wiki/Persistent_data_structure).  Instead of copying anything when pushing on to a stack, we cab make the new stack instance hold only the newly added item, and maintain a reference to the previous instance storing the rest of the items.  Popping from the stack can then simply return the previous instance.  Basically, the stack becomes an immutable single-linked list.

```csharp
public abstract class PersistentStack<T> : IStack<T> {
	public static readonly PersistentStack<T> Empty = new EmptyNode();

	public IStack<T> Push(T element) {
		return new LinkNode(this, element);
	}

	private class EmptyNode : PersistentStack<T> {
		public override IStack<T> Pop() {
			throw new InvalidOperationException("Stack is empty");
		}
		public override T Peek() { 
			throw new InvalidOperationException("Stack is empty");
		}
		public override bool IsEmpty { get { return true; } }
	}

	private class LinkNode : PersistentStack<T> {
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
```

In this implementation, the empty and non-empty nodes are different enough that I decided to use polymorphism rather than `if` statements.  The `PersistentStack<T>` type contains the only common logic (`Push()`); everything else is implement by the two concrete classes.

Here, the empty stack truly is a singleton; only one instance will ever be created for each element type.  It can only be used as a starting point to create new stacks; the other methods simply throw exceptions.  It also serves as the final node in the chain for all non-empty stacks.

Pushing onto any stack (empty or not) returns a new node that holds the new item and points to the previous stack; popping a non-empty stack simply returns that reference.

Like other linked lists, this approach implements both `Push()` and `Pop()` in O(1) in both memory and time.  



[_Next time: Adding covariance_]({% post_url 2013-06-28-covariant-immutable-stack %})