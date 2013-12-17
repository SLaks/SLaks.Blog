---
title: "Using inline visitors"
layout: "post"
categories: [C#, Java, concepts, design-patterns]
---

The visitor pattern is very useful when traversing trees or complex hierarchies (eg, expression trees, CSS, HTML).

However, unlike LINQ, it is not easily embeddable in C#.  Java can solve this using anonymous inner classes; C# requires a separate class which loses the context of the invoking method.  For example, https://github.com/madskristensen/WebEssentials2013/blob/master/EditorExtensions/Completion/HTML/HtmlLabelForAttributeCompletion.cs

Instead, we can use lambda expressions, either through collection initializers (many subtypes), extension methods (single type), or objects with properties (few visit method).

https://github.com/madskristensen/WebEssentials2013/blob/master/EditorExtensions/Helpers/Css/CssItemAggregator.cs
