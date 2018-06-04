---
title: "Immutability, part 4: Building lock-free data structures"
layout: "post"
categories: [C#, lock-free, multi-threading, concepts]
---

As I mentioned [last time]({% post_url 2013-07-22-thread-safe-data-structures %}), the best way to create simple thread-safe lock-free data structures is with compare-and-swap loops.

To recap, this technique works as follows:

> 1. Fetch the current value of the field into a local variable
> 2. Run your actual logic to generate a new immutable object based on the current value (eg, push an item onto an immutable stack)
> 3. Use the atomic [compare-and-swap](https://en.wikipedia.org/wiki/Compare-and-swap) operation to set the field to the new value if and only if no other thread has changed it since step 1.
> 4. If a different thread has changed the object (if the compare-and-swap failed), go back to step 1 and try again.

In C#, this algorithm looks like this:

```csharp
/// <summary>Holds a reference to an immutable class and updates it atomically.</summary>
/// <typeparam name="T">An immutable class to reference.</typeparam>
class AtomicReference<T> where T : class {
	private volatile T value;
	
	public AtomicReference(T initialValue) {
		this.value = initialValue;
	}

	/// <summary>Gets the current value of this instance.</summary>
	public T Value { get { return value; } }
	
	/// <summary>Atomically updates the value of this instance.</summary>
	/// <param name="mutator">A pure function to compute a new value based on the current value of the instance.
	/// This function may be called more than once.</param>
	/// <returns>The previous value that was used to generate the resulting new value.</returns>
	public T Mutate(Func<T, T> mutator) {
		T baseVal = value;
		while(true) {
			T newVal = mutator(baseVal);
			#pragma warning disable 420	
			T currentVal = Interlocked.CompareExchange(ref value, newVal, baseVal);
			#pragma warning restore 420

			if (currentVal == baseVal)
				return baseVal;			// Success!
			else
				baseVal = currentVal;	// Try again
		}
	}
}
```

This class encapsulates a mutable reference to an inner type `T`, which must be immutable.  The `Mutate()` function can be called to assign a new value based on the previous value, and will keep calling its callback until the current value does not change underneath it, as described above.

The `#pragma warning` directive is necessary to suppress a false positive about passing a `volatile` field as a `ref` parameter.  Ordinarily, passing a field by reference will not preserve the field's volatility, but the `Interlocked` methods are an exception to this rule.  This is noted in the warning's [documentation](https://msdn.microsoft.com/en-us/library/4bw5ewxy).

Using this class with my earlier immutable stack, one can easily implement a thread-safe lock free mutable stack:

```csharp
class AtomicStack<T> {
	private readonly AtomicReference<IStack<T>> stack 
		= new AtomicReference<IStack<T>>(PersistentStack<T>.Empty);
	
	public void Push(T item) {
		stack.Mutate(s => s.Push(item));
	}
	public T Pop(T item) {
		var oldStack = stack.Mutate(s => s.Pop());
		return oldStack.Peek();
	}
	public T Peek() {
		return stack.Value.Peek();
	}
}
```
The `Push()` and `Pop()` methods call their respective counterparts on the inner immutable stack, wrapped in the `Mutate()` operation so that they keep trying until the mutation succeeds.

`Peek()` simply gets the current value of the reference and peeks at the top of that stack.  It is important to note that `stack.Value` can change at any time.  Had this method needed to access the value twice, it would need to cache the current value of the field to prevent it from changing between two operations.  
For example:

```csharp
public IEnumerable<T> PeekTwice() {
	var current = stack.Value;
	yield return current.Peek();
	yield return current.Peek();
}
```

Compare-and-swap loops are the most efficient way to implement simple atomic lock-free data structures.  However, writing thread-safe code is still intrinsically complicated; you still need to make sure to correctly use atomic operations and not operate on data that may change underneath you.