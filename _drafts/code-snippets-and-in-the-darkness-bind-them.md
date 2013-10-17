---
title: "Code Snippets: And in the darkness bind() them"
layout: "post"
categories: [Javascript, code-snippets]
---

The new ES5 `bind()` function is very useful for passing callbacks or event handlers that use an existing `this`.

It also has some more confusing uses.

If you have an array of functions, and you want to execute every function in the array, you can write

```js
myFuncs.forEach(function(f) { f(); });
```

However, all you're really doing is calling `.call()` on every function in the array.
Therefore, you would instead want to write

```js
myFuncs.forEach(Function.prototype.call);
```

However, this won't work, because `call()` calls the function in its `this` parameter (eg, `myFunc.call()`), not its first argument.  This code would end up running 

```js
Function.prototype.call.call(null, myFuncs[0], 0, myFuncs);
```

This will throw a `TypeError`, since `call()` can only be called on a function.

What you actually want to run is

```js
Function.prototype.call.call(Function.prototype.call, myFuncs[0], ...);
```

In other words, you want to call `call()` and pass your function as its `this` (before any other parameters).  To make `forEach()` do that, you need to bind `call()` to itself:

```js
myFuncs.forEach(Function.prototype.call.bind(Function.prototype.call));
```

To make this code shorter (and even more confusing), note that since `Function` is itself an instance of `Function`, you can skip the prototype and reference `call` directly:

```js
myFuncs.forEach(Function.call.bind(Function.call));
```

You can make it even shorter by referencing `call` from a shorter function:

```js
myFuncs.forEach(eval.call.bind(eval.call));
```

(other short function names, such as `Date` or `isNaN`, would also work)

_Side note:_ Please, don't do this.