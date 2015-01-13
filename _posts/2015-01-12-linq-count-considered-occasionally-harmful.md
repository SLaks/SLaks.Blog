---
title: "Count() Considered Occasionally Harmful"
layout: "post"
categories: [C#, LINQ]
---

How many times have you seen code like this?

<div class="small"></div>
```csharp
if (someSequence.Count() > 2) { }
```

LINQ's [`.Count()` method](http://msdn.microsoft.com/en-us/library/vstudio/bb338038() has an important performance subtlety which can make this code unnecessarily slow.  The root of the problem is that the `IEnumerable<T>` interface, which all LINQ methods operate on, doesn't actually have a count (if it did, there would be no need for the `Count()` extension method in the first place).  Therefore, the `Count()` method is actually O(n), looping through the entire collection to count every item.

Fortunately, the implementation of `Count()` is a bit smarter than this.  As you can see in the [source](http://referencesource.microsoft.com/#System.Core/System/Linq/Enumerable.cs,41ef9e39e54d0d0b), `Count()` will check whether the source collection implements `ICollection<T>` or `ICollection`, and, if it does, will directly return the `Count` property without iterating at all (thus becoming O(1)).  Unfortunately, it does not check for `IReadOnlyCollection<T>`; if you call `Count()` on a collection that implements `IReadOnlyCollection<T>` but not `ICollection<T>`, it will still be O(n).  There are no such types in the BCL, but this has been enough of an issue for Roslyn that they wrote [an analyzer](http://source.roslyn.codeplex.com/#Roslyn.Diagnostics.Analyzers.CSharp/Performance/LinqAnalyzer.cs) to prevent it.

In fact, it can be even worse than that.  It is perfectly possible to make an infinite `IEnumerable<T>` &ndash; a sequence that can be iterated as far as you want, without running out of elements.  For example:

```csharp
IEnumerable<int> RandomStream(int max) {
	var rand = new Random();
	while (true) yield return rand.Next(max);
} 
```

This sequence will work fine with most LINQ methods, because LINQ will only iterate through the sequence as far as it needs to.  However, if you call any method that consumes the entire collection (such as `Count()`, `Last()`, `OrderBy()`, `ToList()`, and some others), it will either hang forever, or eventually throw an OverflowException or OutOfMemoryException, depending on exactly what the method does (`Last()`, for example, will hang without throwing anything).

The lesson from this mess is that `Count()` should be called with caution.  If you actually need to know exactly how many items are in a sequence, there is no alternative; you must simply beware that if the source doesn't implement `ICollection<T>`, it will be an O(n) call.  Obviously, if the sequence is in fact infinite, this will not &ndash; and cannot &ndash; work.

If, on the other hand, you're simply checking whether a sequence has at least _N_ elements, like the code at the beginning of this blog post, there is no need to iterate over the entire sequence, and no reason for the code to fail on infinite sequences.  All you need to do is iterate through the sequence, then stop immediately once you find _N_ elements.  You can do that in one line of LINQ:

<div class="small"></div>
```csharp
if (someSequence.Skip(2).Any()) { }
```

However, this code is still not perfect.  If the sequence does in fact implement `ICollection<T>`, this will be unnecessarily slow; instead of simply checking the `Count` property, it needs to instantiate two enumerators (one for each LINQ method), and iterate through the first _N_ items in the sequence.  In this scenario, checking `Count()` is in fact faster.

To get the best of both worlds, you need to write your own LINQ method:

```csharp
public static bool HasMoreThan<T>(this IEnumerable<T> sequence, int count) {
	if (count < 0) return true;
	int? staticCount = (sequence as ICollection<T>)?.Count 
					?? (sequence as ICollection)?.Count					?? (sequence as IReadOnlyCollection<T>)?.Count;
	if (staticCount != null)
		return staticCount > count;
	using (var enumerator = sequence.GetEnumerator())
		for (int i = 0; i < count + 1; i++)			if (!enumerator.MoveNext())
				return false;
	return true;
}
```

This method first checks whether the sequence implements common collection interfaces, and, if so, retrieves the count directly.  If it doesn't, it manually enumerates that many elements from the enumerator to see if it runs out.

Using the enumerator directly is slightly faster than using LINQ methods; it avoids allocating an extra iterator state machine from `Skip()`.  You can simplify it like this at a slight GC cost:

```csharp
return sequence.Skip(count).Any();
// Or
using (var enumerator = sequence.GetEnumerator())
	return Enumerable.All(Enumerable.Repeat(0, count + 1), x => enumerator.MoveNext());
```

Each of these implementations involve one extra allocation (an iterator state machine) compared to the longer version.

