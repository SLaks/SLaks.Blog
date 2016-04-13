---
title: "LESS: Secrets of the Ampersand"
layout: "post"
categories: [LESS]
---
One of the less-documented features of the [LESS language](http://lesscss.org) is the ampersand selector, which refers to the parent selector inside a nested selector.

The ampersand selector is most commonly used when applying a modifying class or pseudo-class to an existing selector:

<div class="less"></div>
```scss
a {
	color: blue;
	&:hover {
		color: green;
	}
}
```

The inner selector in this example compiles to `a:hover`.  Without the `&`, it would compile to `a :hover` (a descendant selector that matches hovered elements inside of `<a>` tags), 
  which is not what the author intended.

However, `&` has a variety of other uses.

# Changing state based on parent classes

`&` can be used to make a nested selector that only applies its rules when an _ancestor_ of the outer selector has a class.  For example:

<div class="less"></div>
```sass
form a {
	color: purple;
	body.QuietMode & {
		color: black;
	}
}
```

This compiles to

```css
form a {
  color: purple;
}
body.QuietMode form a {
  color: black;
}
```

This allows a `QuietMode` class to be applied to the root element to override loud styles, while keeping the quiet and "loud" (default) styles for each element in the same place.

This technique is particularly useful in mixins; it allows a mixin to to wrap a larger selector around the selector it was called in.  For example:

<div class="less"></div>
```sass
.MyBox(@size, @color) {
	width: @size - 4px;
	border: 2px solid darken(@color, 10%);
	background: @color;

	body.SimpleMode & {
		width: @size - 2px;
		border: 1px solid @color;
		background: inherit;
	}
}
```
Using a prefix with the `&` allows the mixin to emit rules that are not nested in the location where the mixin was invoked, allowing it to specify higher-level filters.

# Filtering a nested selector to only match certain elements
Similarly to the previous example, `&` can be used to create a nested selector (in a mixin or in another selector) that only matches a specific element.  For example:

<div class="less"></div>
```scss
.quoted-source {
	background: #fcc;
	blockquote& {
		background: #fdc;
	}
}
```

This compiles to 

```css
.quoted-source {
	background: #fcc;
}
blockquote.quoted-source {
	background: #fdc;
}
```

This allows you to add speciallize a class for a specific element type, while keeping the specializations nicely nested within the rest of the class.

# Avoiding repetition when selecting repeated elements
`&` can be used to repeatedly refer to the parent selector, while keeping your code [DRY](http://en.wikipedia.org/wiki/Don%27t_repeat_yourself "Don't repeat yourself").  For example:

<div class="less"></div>
```sass
.btn.btn-primary.btn-lg[disabled] {
	& + & + & {
		margin-left: 10px;
	}
}
```
This compiles to

```css
.btn.btn-primary.btn-lg[disabled] + .btn.btn-primary.btn-lg[disabled] + .btn.btn-primary.btn-lg[disabled] {
	margin-left: 10px;
}
```

This example will add space between consecutive runs of large disabled buttons, without repeating the entire selector three times.

# Simplifying combinatorial explosions

`&` can be used to easily generate every possible permutation of selectors for use with combinators.  For example:

<div class="less"></div>
```scss
p, blockquote, ul, li {
	border-top: 1px solid gray;
	& + & {
		border-top: 0;
	}
}
```

This code will select all paragraph-like elements and add an upper border, then remove that border from such elements that already have one immediately preceding it.

The ampersands expand into all 16 possible combinations of these elements, without needing to type them by hand.  These 6 simple lines expand into 24 lines or raw CSS:

```css
p,
blockquote,
ul,
li {
  border-top: 1px solid gray;
}
p + p,
p + blockquote,
p + ul,
p + li,
blockquote + p,
blockquote + blockquote,
blockquote + ul,
blockquote + li,
ul + p,
ul + blockquote,
ul + ul,
ul + li,
li + p,
li + blockquote,
li + ul,
li + li {
  border-top: 0;
}
```

This technique works because LESS recognizes the comma combinator and expands nested selectors for each alternative.