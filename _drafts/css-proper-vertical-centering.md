---
title: "Proper Vertical Centering in CSS"
layout: "post"
categories: [css, layout]
---

One of the most common questions in CSS layout that has no obvious answer is how to vertically center text (or other content) within a taller block.

There are a variety of hacks to achieve vertical centering, but each one has its limitations:

 - Set `line-height` to be equal to `height`
  - This only works if there is exactly one line of text, and requires the height of the parent container to be hard-coded twice in the CSS.

 - Use absolute positioning with a negative `margin-top`
  - This requires the height of the centered content to be hard-coded twice in the CSS; it cannot work with variable-sized content

 - Use CSS tables
  - This requires one or two extra non-semantic elements in the source HTML, and can raise annoying layout problems depending on usage

However, CSS3 quietly introduced a much more powerful alternative to table layout that can be also used to vertically center content without any of this limitations.

##Flexbox to the rescue
Simply apply these two rules to the parent element:
```css
display: flex;
align-items: center;
```

The `align-items` property specifies how the children of the flexbox should be aligned in the transverse axis (perpendicular to the direction that they flow in).

Note that elements in a flexbox will automatically shrinkwrap to fit their content.  You can prevent that by applying `width: 100%` to the child elements, or you can horizontally center them by adding `justify-content: center` or `justify-content: space-around` to the parent.  (`space-around` will add space outside the outermost elements too; `center` will leave the outmost elements flush against the edges of the container)