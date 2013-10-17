---
title: "Creating vertical text or block layouts in CSS"
layout: "post"
categories: [css, LESS, layout]
---

One common web design question is how to make text that runs vertically.  CSS does not have any dedicated support for text rotation.  However, you can use the general `transform` property instead:

```css
.MyBlock {
	transform: rotate(90deg);
}
```

(for brevity, I'm leaving out vendor prefixes)

However, CSS transforms only affect how an element is rendered; it does not affect layout.  This means that your element will occupy space as if it were not rotated.  

If you're using absolute positioning, this isn't a problem; however, if you're making flow-based or column-based layouts using `float: left` or `display: inline-block`, it can completely break your layout.

To solve this, we need to put the content in an absolutely-positioned child element.  This way, the parent element can have the post-rotation dimensions, to correctly affect layout, and the child element can have the pre-rotation dimensions, so that it looks right.

```css
.Bookshelf:not(.Vertical), .Bookshelf.Vertical span {
	width: @bookshelfWidth;
	height: @bookshelfHeight;
	display: block;
	background: #5a3326 url(../Images/Wood_African-Ebony.jpg);
	color: white;
	text-align: center;
}


.Bookshelf.Vertical {
	// Vertical bookshelves have inverse dimensions, and
	// render the actual bookshelf in a rotated element.
	height: @bookshelfWidth;
	width: @bookshelfHeight;

.Bookshelf.Vertical span {
	transform: rotate(90deg);
	margin-top: -1rem;
}
```

The styles for the content itself are applied to two selectors; one for horizontal and one for vertical.

To avoid the duplication, we can use a LESS mixin, with the dimensions as parameters and the content styles [as a lambda]().