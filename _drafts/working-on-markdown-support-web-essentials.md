---
title: "Working on Markdown support for Web Essentials 2013"
layout: "post"
categories: [visual-studio-2013, C#, web-essentials]
---

[Web Essentials](http://vswebessentials.com/) is an awesome extension for Visual Studio that adds lots of useful web development features.  The VS 2013 version (and now also the [2012 version](https://github.com/madskristensen/WebEssentials2012])) is now [open-source](https://github.com/madskristensen/WebEssentials2013), so people can now contribute directly.

One of Web Essentials' lesser features is a Markdown editor, with basic syntax highlighting and a preview pane.

The Markdown syntax highlighting [originally]() used a series of simple regexes to 

One of my first pull requests to Web Essentials was a [vastly more complicated set of regexes](https://github.com/madskristensen/WebEssentials2013/pull/6) for more accurate highligthing.  However, this 