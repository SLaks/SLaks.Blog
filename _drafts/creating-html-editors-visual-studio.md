---
title: "Creating HTML-based Editors in Visual Studio 2013"
layout: "post"
categories: [visual-studio-2013, vs-extensions]
---


Visual Studio 2013 completely rewrote the HTML editor.  The new HTMLX editor uses the modern WPF-based editor stack and is thus very extensible, as I've [discussed previously]({% post_url 2013-10-18-extending-visual-studio-part-1-getting-started %}).

One of the possibilities this opens up is creating editors for new ContentTypes that inherit HTML and are thus based on the HTML editor.  This is useful for templating languages like Razor or for markup languages like Markdown.  (Both of which use this technique in Visual Studio)

Extending an editor is very simple; just create a new ContentType and include the `htmlx` ContentType as its base type.  However, that is not enough to properly initialize the HTMLX editor.  If you take this approach alone, portions of the editor (especially IntelliSense, and ProjectionBuffers like embedded CSS) will not work.

To fix this, you need to also register your new file extensions under the old COM-based editor registration system to use the HTML editor.  This will make Visual Studio invoke `HtmlEditorFactory` before creating the WPF text editor, which will properly initialize the `HtmlDocument` for use with the components of the new editor.

https://twitter.com/jasonmalinowski/status/390456397034307584
https://github.com/SLaks/WebEssentials2013/commit/3027ff9fc4c89668b7c0dad7c8967431c836007e