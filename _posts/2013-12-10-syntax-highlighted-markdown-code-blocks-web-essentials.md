---
title: "Syntax-highlighted Markdown Code Blocks in Web Essentials"
layout: "post"
categories: [visual-studio-2013, web-essentials, markdown]
---

After over two months of work, I rewrote the Markdown editor in [Web Essentials](http://vswebessentials.com/) to support syntax highlighting & IntelliSense for embedded code blocks.

If you add a GitHub-style [fenced code block](https://help.github.com/articles/github-flavored-markdown#syntax-highlighting) with a language identifier, Visual Studio will now provide full language services within that code block.
You get the full editing experience you're used to in Visual Studio, including syntax highlighting, IntelliSense, outlining, error checking, code snippets, and Peek Definition.

![Markdown Code Blocks](/images/2013/markdown-code-demo.png)
![Markdown IntelliSense & Errors](/images/2013/markdown-errors-intellisense.png)

This is perfect for writing Readmes or documentation for open-source projects on GitHub, or for any other Markdown files you may write.

# How it works
Visual Studio 2010 rewrote the editor from the ground up in WPF.  This new editor has a powerful feature called [Projection Buffers](http://msdn.microsoft.com/en-us/library/dd885240.aspx#projection), which allow a single editor to seamlessly mix text from different sources.  This can be used to make a virtual editor that mixes code from different files (eg, [Debugger Canvas](http://blogs.msdn.com/b/kaelr/archive/2012/03/10/code-canvas-vs-code-bubbles-vs-debugger-canvas.aspx)), or to mix different languages within a single file (eg, Javascript and CSS blocks within an HTML file).

My Markdown editor uses this feature to project code blocks in your Markdown files using Visual Studio's built-in editor services   

# What languages are supported?
Any language that Visual Studio can highlight, including any custom extensions you've installed.  

All languages services built for the new WPF-based editor should work perfectly with projection buffers.  This includes HTML (sort of), CSS, Javascript, and any languages from extensions that only work in VS2010 or later.  The language service itself needs to work properly with projection buffers; if it makes unwarranted assumptions about text buffers always having files on disk or only one TextView, things may not work.  

If the language service needs to initialize things for its services to work (eg, a project system), I can still support it using an `ICodeLanguageEmbedder`, which Web Essentials will call to initialize whatever is necessary.  If you have such a language service, feel free to send a pull request.

Before VS2010, an older system called [contained languages](http://msdn.microsoft.com/en-us/library/bb166334.aspx) allowed editors to be mixed like this.  However, this system needed explicit integration from the language service being embedded.  As far as I know, the only langauge services that support contained languages are C# & VB.  I added an adapter layer to make these languages work as well (thanks to [Jason Malinowski](https://twitter.com/jasonmalinowski) for spending lots of time getting this to work).  If you have a different language that implements `IVsContainedLanguageFactory`, get in touch with me & I'll add support.

To specify the language, use either the name of the ContentType or any extension (without the `.`) recognized by Visual Studio.  If there are other names that should be recognized, send a pull request to add them to the map in `ContentTypeExtensions.ContentTypeAliases`.

<h1 id="known-issues">Known Issues</h1>

 - Fenced code blocks don't work in the Preview pane  
We use [MarkdownSharp](https://code.google.com/p/markdownsharp/) to compile Markdown to HTML for the preview pane, and it does not support fenced code blocks.  Until MarkdownSharp is upgraded (or until we find an alternative), we can't support that.

 - Autoformat doesn't work  
  The HTML auto-format engine does not work properly with embedded code blocks.  This may be fixed in the next release of the web tooling.

 - Embedded XML, C++, and F# don't get any syntax highlighting or IntelliSense  
  These languages are built using the old `IVsColorizer` infrastructure and cannot work in ProjectionBuffers.  There is a separate service called `IVsContainedLanguage` that could allow old language services to work, but AFAIK, it is only implemented by C# & VB.

 - Highlighted ranges don't update correctly for certain kinds of edits  
Keeping track of where code blocks are as you edit the document (without spending too much time parsing) is complicated.  If you notice it failing, [file a bug](https://github.com/madskristensen/WebEssentials2013/issues/new) and tell me exactly what you changed (please include the source file if you can).

 - Code blocks automatically indent too far  
I'm not sure how fixable this is.

 - Background colors in syntax highlighting don't appear  
It looks like the background color for the Markdown code block overrides any background colors within the code itself.  Other than disabling the background color for code blocks (in Options), I'm not sure if there is any way to fix this.


<h1 id="whats-next">What's Next</h1>
So far, all I've done is provide the foundation for a modern Markdown editing experience.  There are lots of other features that would make the Markdown editor more complete.  If you would like to work on to any of these features, [tweet me](https://twitter.com/Schabse) and I'll give you advice.

 - Toolbar buttons & shortcut keys to toggle bold, italic, quotes, headers, lists
 - Pre-typing list or indented-code-block prefixes when pressing enter
 - IntelliSense, URL tooltips, & clickable hyperlinks for reference-style links (eg, `[text][link name]`)
 - Smart tags to toggle between inline links and reference links
 - IntelliSense for URL paths in links
 - Separate IntelliSense & highlighting for [YAML front-matter](http://jekyllrb.com/docs/frontmatter/) for Jekyll blog posts ([#148](https://github.com/madskristensen/WebEssentials2013/issues/148#issuecomment-26823193))
 - Thumbnail tooltips for images
 - Separate config file with referenced assemblies & `using` statements for IntelliSense in C#/VB code blocks
 - Fix parser to code blocks in lists (which need 8 spaces)
 - Fix highlighting for quote blocks