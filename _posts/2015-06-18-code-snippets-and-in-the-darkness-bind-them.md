---
title: "Code Snippets: And in the darkness bind() them"
layout: "post"
categories: [Javascript, code-snippets]
---
_This post is part of a [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

Javascript's [`bind()` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) (new to ES5) is very useful for passing callbacks or event handlers that use an existing `this`.

It also has some more confusing uses, especially when combined with `call()` or `apply()`.  

If you have an array of functions, and you want to execute every function in the array, you can write

<div class="small"></div>
```js
myFuncs.forEach(function(f) { f(); });
```

However, all you're really doing is calling `.call()` on every function in the array.
Therefore, you would instead want to write

<div class="small"></div>
```js
myFuncs.forEach(Function.prototype.call);
```

However, this won't work, because `call()` calls the function in its `this` parameter (ie, `myFunc.call()`), not its first argument.  This code would end up running 

<div class="small"></div>
```js
Function.prototype.call.call(null, myFuncs[0], 0, myFuncs);
```

This will throw a `TypeError`, since `call()` can only be called on a function.

What you actually want to run is

<div class="small"></div>
```js
Function.prototype.call.call(Function.prototype.call, myFuncs[0], ...);
```

In other words, you want to call `call()` and pass your function as its `this` (before any other parameters).  To make `forEach()` do that, you need to bind `call()` to itself:

<div class="small"></div>
```js
myFuncs.forEach(Function.prototype.call.bind(Function.prototype.call));
```

To make this code shorter (and even more confusing), note that since `Function` is itself an instance of `Function`, you can skip the prototype and reference `call` directly:

<div class="small"></div>
```js
myFuncs.forEach(Function.call.bind(Function.call));
```

You can make it even shorter by referencing `call` from a shorter function:

<div class="small"></div>
```js
myFuncs.forEach(eval.call.bind(eval.call));
```

(other short function names, such as `Date` or `isNaN`, would also work)

_Side note:_ Please, don't do that.

This technique effectively "uncurries" the `this` parameter from a function.  It takes `call()`, which accepts the function to call as `this`, and produces a function that accepts the function to call as its first normal parameter (and ignores `this`).  You can use the same technique for other prototype functions.  For example, you can turn `Array.push` into a standalone function that mutates its first parameter:

```js
var pushInto = Function.call.bind(Array.prototype.push);

var myArray = [1, 2];
pushInto(myArray, 3);
console.log(myArray); // 1,2,3
```

Or you can take an array of strings and turn them to uppercase:

<div class="small"></div>
```js
["a", "b"].map(Function.call.bind(String.prototype.toUpperCase));
```

You can also do even more confusing things by `bind()`ing `bind` itself.   For example, you can simplify the above examples by wrapping the bound `call` in its own function:

```js
var uncurryThis = Function.bind.bind(Function.call);
var copyArray = uncurryThis(Array.prototype.slice);

var array = [1, 2, 3];
var copy = copyArray(array);
```

This works by binding `bind()` to have `call` as its `this` parameter, so that the resulting function becomes `call.bind()`.  I've seen this trick in [actual production code](https://github.com/kriskowal/q/blob/78131d76e9fdeaee11094f5f4afa9182d801348e/q.js#L123-L124), in the most popular Javascript promise library (it was eventually replaced with an explicit version [for performance reasons](https://github.com/kriskowal/q/blob/75058c0d70d36dd7e814c13493866043df39c858/q.js#L266-L268)).

You can take an array of objects, and turn it into an array of functions bound to those objects:

```js
var elements = [document.head, document.body];
var cloners = elements.map(Function.bind.bind(Element.prototype.cloneNode));
var clone0 = cloners[0]();
```

This takes an array of elements and creates an array of functions that will clone those elements on each call.  It works by binding `bind()` to bind `cloneNode()`; it ends up calling `cloneNode.bind(array[x])`.  

_Side note:_ With great power comes great responsibility.  Just because you can write code like this doesn't mean you should.
