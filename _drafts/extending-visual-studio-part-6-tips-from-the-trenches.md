---
title: "Extending Visual Studio 2013, Part 6: Tips from the Trenches"
layout: "post"
categories: [visual-studio-2013, vs-extensions]
---

# Use the source, Luke!
In the absence of sufficient documentation, reading the Visual Studio source code is the best way to find out exactly how features work and how to extend them.  Unfortunately, unless you're lucky enough to be working for Microsoft, you probably don't have access to the source code.  Even without full source, though, decompiling various Visual Studio assemblies is extremely useful when figuring out how to extend things.  Relevant assemblies to decompile include `Microsoft.VisualStudio.Text.UI`, `Microsoft.VisualStudio.Text.Logic`, `Microsoft.VisualStudio.Text.UI.Wpf`, `Microsoft.VisualStudio.Text.Data`, `Microsoft.VisualStudio.Editor.Implementation`, `Microsoft.VisualStudio.Text.Internal`, `Microsoft.VisualStudio.Platform.VSEditor`...

If you're extending web-related features (eg, the HTML or CSS editors), you'll also want `Microsoft.Web.Core`, `Microsoft.Html.Core`, `Microsoft.Html.Editor`, `Microsoft.CSS.Core`, `Microsoft.CSS.Editor`, and `Microsoft.VisualStudio.Html.Package`.

You can find all of these assemblies in the GAC; make sure to only open assemblies from the version of Visual Studio you're extending.

# Be aware of the useful utility classes scattered throughout Visual Studio itself
Look at classes like `WebEditor`, `PackageUtilities`, `Microsoft.Internal.VisualStudio.PlatformUI.HierarchyUtilities`, `Microsoft.Web.Core.TextHelper`, `, `Microsoft.Web.Core.ProjectionBufferHelper`, .

There are also repositories of useful extension methods, such as `Microsoft.VisualStudio.Web.Editor.TextBufferUtilities`

# Dealing with HRESULTS
http://msdn.microsoft.com/en-us/library/vstudio/bb164625.aspx

# Crawl the dependency tree
One particularly useful feature of most decompilers is the Analyze References feature.

# Use the debugger
Use the Visual Studio debugger find out what is invoked at different points in type.  You can set breakpoints in your code to find out when Visual Studio calls different pieces.  You can also press Ctrl + D, N to set a breakpoint in a function within Visual Studio itself to find out when built-in components are invoked.

If you want to figure out how to duplicate specific feature, you can find that feature in your decompiler, then add a new breakpoint at the class' constructor (enter `Namespace.ClassName.ClassName` to break at a constructor) and look at the call stack to see how it gets loaded.

When setting these breakpoints, open the Breakpoints window and make sure your new breakpoint says `(currently 0)` in the Hit Count column; this tells you that it bound successfully.

# Disable Optimizations

# Write Unit Tests
If you're writing complicated code that does not directly involve the VS editor (eg, parsing code to syntax highlighting or IntelliSense activation), keep that code separate from the VS components and write standalone unit tests to make sure your logic is correct.

# Remember about corner cases
ProjectionBuffers

Project Folders

Files without projects

Unloading projects