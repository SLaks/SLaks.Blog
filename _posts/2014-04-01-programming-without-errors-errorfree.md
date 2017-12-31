---
title: "Programming without errors – ErrorFree"
layout: "post"
categories: [ErrorFree, programming-languages, april-fools]
---

Errors are one of the most common and annoying problems in programming.  Whether it's the parser, the compiler, the type system, the runtime, or even system memory, everything you work with seems to have some way of complaining to you and refusing to run your code.  Programmers spend more time fixing errors than any other task when developing applications <sup>[citation needed]</sup>.

But what if you could program without any errors?

To avoid these troublesome errors, I am proud to present a new language called **ErrorFree**.  This language cannot have any errors, anywhere.  In fact, every possible file, of any length, is a valid ErrorFree program that can compile and run successfully.

# Design Philosophy
Avoiding every possible kind of error (while maintaining Turing-completeness) presents a number of challenges:

 - **Syntax errors**  
To avoid all syntax errors, ErrorFree cannot have any kind of syntax.  Syntactical constructions such as blocks, matching braces, or composite expressions all present opportunities for syntax errors, and are thus unacceptable.  
Instead, ErrorFree is a stack-based language that is parsed one byte at a time.  Every byte, except for pre-defined operator bytes, will simply push its numeric value onto the stack.  Operator bytes will perform operations on the value(s) at the top of the stack.  
For example, the ErrorFree program `12+` will push the values `49` and `50` on to the stack (remember that these are bytes, not ASCII or Unicode characters), then add them together, resulting in a stack containing the number `99`.

 - **Encoding errors**  
To avoid errors from invalid Unicode characters or UTF8-encoded sequences, ErrorFree source files are never treated as strings.  Instead, each byte is interpreted directly.  For programmer convenience, operator bytes are chosen based on their ASCII characters, making it easy to write ErrorFree code in a hex editor.

 - **Stack underflow errors**  
Source files like `+`, which tries to operate on an empty stack, must also be valid.  Therefore, the ErrorFree stack is pre-populated with an infinite number of zeros.  Thus, it is never possible to run out of numbers on the stack.

 - **Arithmetic errors**  
Since dividing by zero (including 0 &divide; 0) must also be valid, the ErrorFree stack is composed of double-precision floating-point numbers, so that these operations can simply return NaN or Infinity, instead of throwing an error.  In contexts where an integer is required (eg, jumps or heap addresses), regular numbers are truncated, and NaNs and infinities are converted to zero.

 - **Memory errors**  
Regrettably, most computers do not have unlimited storage capacity.  If the stack grows too large to store, ErrorFree implementations are allowed to drop values from the bottom of the stack (above the cushion of infinite zeros) to reclaim space.  Similarly, if the heap (see below) grows too large, the implementation is allowed to drop values from the farthest end from the address being inserted into.  
Implementations are encouraged to avoid this behavior as much as possible.

# Conventions
Every byte in an ErrorFree source file will either push a value to the stack (a _value byte_) or will perform an operation involving the stack (an _operator byte_).  For convenience, operator bytes are chosen based on their ASCII values.  Operator bytes fall into three categories:

 - Arithmetic operators use the appropriate symbols.  For example, `/` will divide the top two values on the stack and push the result.
 - Pure/idempotent operators (operators that only depend on or affect the stack, and do not have side-effects or depend on external state) use lowercase letters symbolizing the operation.  For example, `t` will transpose the top two values on the stack.
 - Impure operators (operators that have side-effects) use uppercase letters symbolizing the operation.  For example, `J` will jump a number of bytes (the top of the stack) from the current position in the source file, then continue executing from that byte.

In addition to the stack, ErrorFree provides a heap, which can store numbers (double-precision floating point, just like the stack) at any positive or negative integral index.  The heap can be used to store data, allowing you to build arrays, linked lists, or other more complex data structures.  Like the stack, the heap is initialized to zero at every location.

ErrorFree does not provide a memory manager, so blocks of heap memory must be tracked by hand.  Similarly, ErrorFree does not provide a call stack, so function calls and return pointers must also be tracked by hand in the heap.

Since raw bytes cannot be displayed as-is, ErrorFree source code should be displayed for reading as sequences of bytes in hexadecimal.  For better readability, operator bytes should be displayed as their single ASCII representation, preceded by a space to maintain alignment.  Newlines are meaningless, and can be used to group operations.  For example:

<div class="errorfree"></div>
```
01 02  +
04  * 05  *
0E  +
```

This code pushes the number 74 (`(((1 + 2) * 4) * 5) + 0xE = 0x4A`) on to the stack. (`4A` cannot be pushed directly, since `J` is an operator byte.)  A simpler alternative would be <code>4B 01&nbsp;&nbsp;-</code>.

# Operators
ErrorFree supports the following operators:

## Arithmetic operators
All arithmetic operators will pop the values they read.

 - `+`  
   Adds the top two values on the stack and pushes the result to the stack.
 - `-`  
   Subtracts the top value on the stack from the second value on the stack, and pushes the result to the stack.
 - `*`  
   Multiplies the top two values on the stack and pushes the result to the stack.
 - `/`  
   Divides the second value on the stack by the top value on the stack, and pushes the result to the stack.  0/0 pushes NaN; dividing other numbers by zero pushes positive or negative infinity.
 - `%`  
   Pushes the second value on the stack modulo the top value.
 - `^`  
   Raises the second value on the stack to the power of the top value, and pushes the result.
 - `=`  
   Pushes one if the top two values on the stack are equal, or zero otherwise.  NaN does not equal itself.
 - `>`  
   Pushes one if the second value on the stack is greater than the top value, or zero otherwise.
 - `<`  
   Pushes one if the second value on the stack is less than the top value, or zero otherwise.

## Pure operators

 - `d` (Duplicate)  
   Pushes a second copy of the top value on the stack.
 - `t` (Transpose)  
   Transposes the top two values on the stack.
 - `a` (Absolute value)  
   Pops a value from the stack and pushes its absolute value.
 - `s` (Sign)  
   Pops a value from the stack and pushes its sign (-1, 0, or 1, or NaN).
 - `r` (square Root)  
   Pops a value from the stack and pushes its square root (or NaN if it's negative).
 - `l` (Log)  
   Pops a value from the stack and pushes its base-10 logarithm  (or NaN if it's negative).
 - `f` (Floor)  
   Pops a value from the stack and pushes the largest integer smaller than that value.  Leaves infinities and NaNs unchanged.
 - `c` (Ceiling)  
   Pops a value from the stack and pushes the smallest integer larger than that value.  Leaves infinities and NaNs unchanged.

## Impure Operators

 - `C` (print Character)  
   Pops a value from the stack, and prints its Unicode codepoint to standard out.  Non-integer values are truncated, negative values are made positive, and infinity and NaN become 0.
 - `N` (print Number)  
   Pops a value from the stack and prints its numeric value to standard out.
 - `D` (the letter after C)  
   Reads a single character from standard in, and pushes its Unicode codepoint index on to the stack.  Pushes -1 for EOF.
 - `O` (the letter after N)  
   Reads a number from standard in (followed by a newline) and pushes it onto the stack.  The strings `Infinity`, `-Infinity`, and `NaN` are parsed as-is; all other letters or invalid characters are stripped.  If there are no numeric characters to read (for example, if standard in is at EOF), this will push 0.  
There is currently no way to determine whether a 0 was read because the user typed zero, because the user typed nothing but letters, or because standard in is at EOF.
 - `R` (Random)  
   Pushes a random number in the range [0, 1) on to the stack.
 - `T` (Timestamp)  
   Pushes the UNIX timestamp for the current time on to the stack.
 - `J` (Jump)  
   Pops a value from the stack, and moves the execution pointer that number of bytes from the current location in the file (forward or backward); execution continues from that byte.  Non-integer numbers are truncated, NaNs and infinities are treated as zero, and indices wrap around after reaching either end of the file.
 - `S` (Save)  
   Pops two values from the stack, then stores the second popped value at the heap location of the first (topmost) value.  Heap locations are truncated to integers; NaNs and infinities become zero.
 - `L`  (Load)  
   Pops a value from the stack, then reads the heap location at that address and pushes its value to the stack.

# Sample program
This 19-byte program prints the squares of numbers 1 through 0x42.  It stores the loop index at heap location 0.

<div class="errorfree"></div>
```
00  L 01  + 00  S
00  L  d  *  N
00  L 42  <
01  +  J
00
```

Here is a line-by-line explanation:

 1. Increment the value at heap location 0.  
    (Load, add one, store)
 2. Print the square of said value.
    (Load, duplicate, multiply, print)
 3. Compare the value at heap location 0 to 0x42, pushing 1 if it's less than 42 and 0 if it's greater or equal.
   (Load, push comparand, compare)
 4. Jump forward by two bytes if it was less (thus wrapping around to the beginning of the file), or one byte if it's time to exit the loop.
   (add one, jump)
 5. A final byte to jump to to exit the program.  Without this byte, jumping forward would either wrap around (for `1`) or remain at the jump instruction (for `0`), so the program would hang after finishing the loop.

# Other notes
It is impossible to make non-breaking changes to the ErrorFree language once it's released, since any new code you want to allow already has an existing meaning.  Instead, newer versions must be explicitly specified when invoking the compiler/interpreter.

ErrorFree does not include a built-in syntax for comments.  Instead, you can simply write your comments directly in the code, then precede them by jump operators so that they don't execute.  When displaying code, comments can be written like operators.  Care must be taken to ensure that no other jump instructions end up jumping into the middle of a comment.  For example:

<div class="errorfree"></div>
```
01 02  +
12  J  T  h  i  s     i  s     a     c  o  m  m  e  n  t
04  +
```
