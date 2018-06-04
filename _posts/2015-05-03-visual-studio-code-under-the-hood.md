---
title: "Visual Studio Code under the hood"
layout: "post"
categories: [visual-studio-code]
---

Last week, Microsoft shocked the development community with [Visual Studio Code](https://code.visualstudio.com), a new lightweight version of Visual Studio with full support for Mac & Linux.   However, while Visual Studio Code may look very similar to the original Visual Studio, it's actaully a complete rewrite, with almost nothing in common.  This blog post will explore VS Code's architecture in greater depth.

Like many recent products coming from DevDiv (Microsoft's Developer Division), Visual Studio code is built almost entirely on open-source software (VS Code itself is not open source, but it [soon will be](https://twitter.com/khellang/status/593466086705766400)).