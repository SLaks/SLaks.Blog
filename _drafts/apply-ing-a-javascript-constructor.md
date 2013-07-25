---
title: "How to apply() a constructor in Javascript"
layout: "post"
categories: [Javascript, HTML, CSS]
---

http://stackoverflow.com/a/17100203/34397

`Function.apply()` is useful when proxying.

```js
Function.prototype.construct = function (args) {
    return new (this.bind.apply(this, [null].concat(args)))();
};
```