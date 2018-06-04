---
title: "Immutability, part 3: Writing thread-safe data structures"
layout: "post"
categories: [thread-safety, lock-free, multi-threading, concepts]
---

[Last time]({% post_url 2013-06-23-creating-immutable-stack %}), I showed how to create a simple [covariant]({% post_url 2013-06-28-covariant-immutable-stack %}) immutable stack.

One of the biggest attractions of immutable types is the ease with which they can be used to write thread-safe code.  However, in the real world, things usually need to mutate.

How can this be done safely?

For an object to be safe, it must not be possible to observe it in an inconsistent state (as long as you follow its documented rules).  For example, it should not be possible to see a collection with a hole in it from the middle of a resize.  

For non-thread-safe objects, this is not very hard.  As long as each function call leaves the object in a consistent state, it doesn't take much effort to enforce this.  It does mean that you must only raise events (or fire callbacks) when the object is in a consistent state.  More subtly, you must only call virtual methods when in a consistent state, since a derived class can call arbitrary code outside the class.  (this is why people criticize Java's approach of making all methods virtual by default).  
Since the object is documented (or assumed to be non-thread-safe, there is no need to ensure that other threads always see a consistent state.

For fully thread-safe objects, this requirement becomes much more difficult.  Because other threads can interact with your object at any time, it must _never_ be in an inconsistent state.  There are a number of ways to make this work.

## Atomic operations
Most instruction sets provide a couple of instructions which execute atomically (such as atomic increment or compare-and-swap).  These instructions are inherently thread-safe; the CPU guarantees that no other thread can see inconsistent results.  However, if your class is anything more complicated than a simple counter, this won't help.

If you're writing higher-level code, you can also use existing higher-level atomic operations, such as `ConcurrentDictionary`.  These operations are in turn implemented using the other techniques described in this article.

## Locks
This is the simplest approach.  If you wrap every public method in a `lock()` statement, other threads can never observe inconsistent state, since they can only start executing after all method calls finish.  This is the approach taken by Java's `Collections.synchronized*()` methods. 

However, this approach [has a number of problems](https://en.wikipedia.org/wiki/Lock_%28computer_science%29#Disadvantages):

 - It's slow.  To guarantee safety, every method must prevent every other method from running, even for methods that would be safe to run concurrently, in case a third, unsafe, method is running too.  This can be mitigated with ReaderWriterLocks, at the cost of additional complexity.  
   In addition, entering a lock is a kernel-level operation that comes with its own costs.
 - It's prone to deadlocks if you lock on an externally visible object (such as `this`).   
If thread A runs some other code that locks on the same object that you're locking on, then starts waiting for some other lock, thread B can end up calling your function while holding that other lock.  Thread B will then wait for thread A to finish before it runs your code, which won't happen because thread A is stuck waiting for the lock that thread B is already holding.
 - It's very prone to deadlocks if your code is re-entrant.  
If thread A calls your code, then tries to grab some other lock in a re-entrant callback, but thread B is already holding that other lock and is now trying to enter your code, you will get a deadlock.  This problem is difficult to fully prevent when writing reusable re-entrant code.

## Compare-and-swap loops

To avoid locks, you must only use primitive atomic operations.  This is where immutable data structures really shine.  If you put all of the state you need to change in a single immutable object, you can make all of the changes from an &lsquo;offline&rsquo; reference to the object, then atomically swap in your new copy if no-one else has changed it.  This technique works as follows:

 1. Fetch the current value of the field into a local variable
 2. Run your actual logic to generate a new immutable object based on the current value (eg, push an item onto an immutable stack)
 3. Use the atomic [compare-and-swap](https://en.wikipedia.org/wiki/Compare-and-swap) operation to set the field to the new value if and only if no other thread has changed it since step 1.
 4. If a different thread has changed the object (if the compare-and-swap failed), go back to step 1 and try again.

It is important that the object being swapped be fully immutable.  Otherwise, changes to parts of the object from other threads can go unnoticed during the atomic replacement, leading to the [ABA problem](https://en.wikipedia.org/wiki/ABA_problem).  

Using deeply immutable objects prevents this from causing a problem.  If `A` is truly immutable, there can be nothing wrong with missing the `B` that happened in the middle; if there was any change that wasn't fully undone, the new value wouldn't be the same `A`.

This technique only works if the mutation you're trying to perform (step 2) is a [pure function](https://en.wikipedia.org/wiki/Pure_function).  Since the operation can run more than once, any side effects that it has can happen multiple times, which will probably break your program.  Similarly, it must be thread-safe (which pure functions implicitly are), since nothing is preventing it from running on multiple threads concurrently.

If the function does have side-effects, you can still use this technique by reverting those side effects if the compare-and-swap failed (in step 4).  This way, the side effects from each invocation will be cancelled before the next try.  However, this can only help if the function and its inverse (to revert changes) are both thread-safe, and if you can guarantee that the brief window of time before the side-effects of a failed attempt are reverted won't cause trouble.  If not, the only solution is a normal lock.

## Make every state &ldquo;consistent&rdquo;

Compare-and-swap loops are the ideal way to implement lock-free mutable data structures.  However, compare-and-swap can only operate on one thing at a time.  If you need to mutate two separate fields, you need more complicated techniques.

If you're mutating two independent fields, compare-and-swap can still be used.  You can simply put all of the state you're modifying into a single immutable class, then perform all of the mutations together inside a single compare-and-swap loop.  

If you're mutating two fields that are connected to each-other, this isn't possible.  A lock-free queue is a good example of this.  A queue needs a head field that points to the first node (for dequeue), and a tail field that points to the last node (for enqueue).

The dequeue operation can be built using an ordinary compare-and-swap loop just like a stack; create a new node that points to the current head and swap out the old head for it.

However, enqueuing an item has two discrete steps.  First, you need to set the `next` pointer of the current tail node to point to the new node, so that it can be dequeued when the head reaches the current tail.  Then, you need to set the tail field to the new node, so that the next enqueue operation starts from the new node. 

These two operations cannot be done in the same compare-and-swap loop, since both fields need to be set atomically.  Otherwise, another thread can start inserting a second new element before `tail` is updated, and one of the nodes will be swallowed.

The obvious way to fix this would be to use a lock to prevent other threads from enqueuing an item between these two steps.  However, you can also do this in a lock-free fashion.  You simply need to make sure that if another thread runs between the two operations, it will first finish the job that the previous thread started.  In other words, before inserting any new node, check whether there is a half-inserted node from another thread and finish inserting it first.

This technique looks roughly like this

 1. Use a compare-and-swap loop to set the `tail` field to `tail.next`, to finish a half-done insertion from a different thread.
 2. Use a compare-and-swap loop to set the `tail.next` to the new node (only if no other thread has set it to a different node at the same time)
 3. Use a compare-and-swap loop to set `tail` to the newly-inserted node, but only if no other thread did so in the meantime from step 1.

Steps 1 and 2 must be done in the same loop in case a third thread inserts a second item after this thread finishes an earlier pending insertion.

The dequeue operation then becomes much more complicated, because it needs to work correctly in all three states.  For more information, see Julian Bucknall's [detailed implementation of a lock-free concurrent queue](http://www.boyet.com/Articles/LockfreeQueue.html).

The basic idea is to design the public methods to be able to run successfully from any intermediate state caused by another thread.  This technique can be very difficult to implement correctly for complex operations.

As with simple compare-and-swap loops, the individual mutations must be either pure or safely revertible.

# Final notes

The idea behind all of these techniques is to either handle or prevent other threads that modify your object while your operation is running.  When using thread-safe objects, you must bear the same requirement in mind.  Any time you perform two operations on an object, it is your responsibility to ensure that nothing has changed between the two operations.  

To aid in this, well-designed concurrent classes will offer composite operations that perform common tasks atomically, such as .Net's [`ConcurrentDictionary.GetOrAdd()` method](https://https://msdn.microsoft.com/en-us/library/ee378677)) (this is [one of the problems](https://stackoverflow.com/a/12182099/34397) with Java's `Collections.synchronized*()` wrappers).  In the absence of such methods, you will still need to use locks to ensure that no other mutations interrupt your operation.


[_Next time: How to build thread-safe lock-free data structures using compare-and-swap loops_]({% post_url 2013-07-29-creating-lock-free-data-structures %})