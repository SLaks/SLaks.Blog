---
title: "Challenges in Silon"
layout: "post"
categories: [less]
---

While writing Silon, I had to overcome number of challenges.  You can see the full details in the comments & commit history of this repo, and in some cases in [bugs I filed in the LESS compiler](https://github.com/less/less.js/issues?utf8=%E2%9C%93&q=is%3Aissue+author%3ASLaks).  Here are some of the more interesting ones.

##Nested XOR
As described above, my operation mixins can take either simple selectors or further logical operations as their operand parameters.  For the most part, this is simple.  For AND operations, I can simply concatenate the parts together using sibling combinators (`~`).  For OR operations, I can simply select each operand separately, and the LESS compiler will automatically expand every combination of alternates via selector nesting.

However, XOR is much harder.  To implement an XOR selector, I need to invert each operand (`a XOR b === (!a AND b) OR (a AND !b)`).  

##LESS Scoping

##Selector ordering

##Duplicate subparts

##Intermediate gates
For this use, the most frustrating issue with CSS is the complete inability to reuse state as a selector.  This is not a common problem.

##Browser bugs
Chrome (only) will choke horribly if a CSS selector has more than a couple of hundred comma-separated parts.

##Checkbox styling
To 

##Drawing logic gates