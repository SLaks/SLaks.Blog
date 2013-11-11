---
title: "Traditional OOP Inheritance in Javascript"
layout: "post"
categories: [Javascript, oop, inheritance, Node.js]
---

_Javasript is not a traditionally object-oriented programming languague_.

Wikipedia [describes Javascript](http://en.wikipedia.org/wiki/Javascript) as a &rdquo;scripting, object-oriented (prototype-based), imperative, functional&ldquo; language.  However, since most developers prefer to use classical (pun intended) object-oriented patterns, people have come up with ways to use Javascript with traditional OOP techniques, including classes and inheritance.

Most Javascript developers are by now familiar with the standard technique for Javascript classes.  For example:

```js
function Animal(name) {
	this.name = name;
	this.legs = [
		new Leg("LF"),
		new Leg("RF"),
		new Leg("LB"),
		new Leg("RB")
	];
}
Animal.prototype.summon = function() {
	ttsEngine.speak(this.name);
};
Animal.prototype.walk = function() {
	// Complicated code involving this.legs()
};

var myCow = new Animal("Betty");
```

The obvious way to add inheritance is to create a new function for the derived class, and set its prototype to an instance of the base class:

```js
// This code is wrong!
function Animal() {	// Abstract
	this.legs = [];	// Child class must populate
}
Animal.prototype.walk = function() {
	// Complicated code involving this.legs()
};

function Kangaroo() {
	this.legs.push("L", "R");
	this.pouch = { };
}
Kangaroo.prototype = new Animal();

var skippy = new Kangaroo();
```

There are a number of problems with this code:

 1. `Kangaroo.prototype.constructor` will be `Animal`, not `Kangaroo`.  

 1. Had the base `Animal` constructor taken parameters, this technique wouldn't pass be able to those parameters on a per-instance basis

 1. Every instance of the derived class will share the same array instance.  After creating two more `Kangaroo` instances, they will appear to have 6 legs each.  
More generall, since the base constructor is only executed once, any mutable state that it creates will be shared by every derived instance.

The first two problems are relatively easy to solve.

To solve the first problem, we can simply add 

<div class="small"></div>
```js
Kangaroo.prototype.constructor = Kangaroo;
```
However, this is not quite good enough.  This will create an _enumerable_ property, meaning that `for in` loops over instance of the derived class will include the `constructor` property.  This behavior is contrary to the default `constructor` property, and is usually unexpected.

We can properly fix this by configuring the property using `Object.defineProperty()`:

```js
Object.defineProperty(
	Kangaroo.prototype, 
	"constructor", 
	{ 
		configurable: true,
		enumerable: false,
		writable: true,
		value: Kangaroo
	}
);
```
Note that `Object.defineProperty()` is [not supported by IE 8](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#Browser_compatibility) (or earlier); this problem cannot be fixed in that browser.

We can fix the second problem by explicitly calling the base constructor, making sure that it receives the correct `this`:

```js
function Kangaroo(name) {
	Animal.call(this, name + " the Kangaroo");
	...
}
```

To fix the third problem, we need to make a new object inheriting `Animal.prototype` to be `Kangaroo`'s prototype, without actually calling the constructor.  This is what the ES5 `Object.create()` function does:

<div class="small"></div>
```js
Kangaroo.prototype = Object.create(Animal.prototype);
```

Since `Object.create()` takes an optional map of property descriptors, we can combine this with the second fix:

```js
Kangaroo.prototype = Object.create(
	Animal.prototype,
	{
		"constructor": { 
			configurable: true,
			enumerable: false,
			writable: true,
			value: Kangaroo
		}
	}
);
```

This is now almost equivalent to the standard `prototype` created for each function, as detailed in the spec in [section 13.2](http://es5.github.io/#x13.2 "Creating Function Objects") (point 17).  

We can move all of this code into a helper function:

```js
function inherits(subConstructor, superConstructor) {
	subConstructor.prototype = Object.create(
		superConstructor.prototype,
		{
			"constructor": { 
				configurable: true,
				enumerable: false,
				writable: true,
				value: subConstructor
			}
		}
	);
}
```
We can then use it like this, making sure to call the superclass constructor inside the subclass constructor (that cannot be done automatically):


```js
// This is the right way
function Animal(name) {	// Abstract
	this.name = name;
	this.legs = [];		// Child class must populate
}
Animal.prototype.walk = function() {
	// Complicated code involving this.legs()
};

function Octopus(name) {
	Animal.call(this, name + " the Octopus");

	this.legs.push(new Array(8).map(function(_, i) { return new Leg("L" + i); });
}
inherits(Octopus, Animal);

var q = new Octopus("Otto");
```

This function is exactly the Node.js `util.inherits()` function does, except that it also adds a `super_` (static) property to the subclass constructor.  For more details, see its [source](https://github.com/joyent/node/blob/546ae2ee/lib/util.js#L552-L575).

This still leaves one more difference from the standard `prototype` property; namely, the spec defines the `prototype` property as non-enumerable.  We can fix that with another call to `defineProperty`:

```js
function inherits(subConstructor, superConstructor) {
	var proto = Object.create(
		superConstructor.prototype,
		{
			"constructor": { 
				configurable: true,
				enumerable: false,
				writable: true,
				value: subConstructor
			}
		}
	);
	Object.defineProperty(subConstructor, "prototype", 	{ 
		configurable: true,
		enumerable: false,
		writable: true,
		value: proto
	});
}
```

This function creates a new prototype that fully complies to the spec.