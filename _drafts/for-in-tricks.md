---
title: "Messing with for in loops"
layout: "post"
categories: [Javascript, evil]
---

Javascript's for in loop hasa surprising subtelty.  

The spec says that there are two versions of the for in loop.

```js
var arr = [], i = 0; 
for (arr[i] in o) 
	i++;
```