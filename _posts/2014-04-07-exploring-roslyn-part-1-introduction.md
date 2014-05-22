---
title: "Exploring Roslyn, part 1: Introduction"
layout: "post"
categories: [Roslyn, .net]
---

The .Net Compiler Platform, codenamed "Roslyn", is the most ambitious project from Microsoft's Developer Division in recent years.  The C# and VB teams got together and rewrote the compilers and language services from scratch in managed code (a mix of C# and VB), replacing a horrible mess of C++ code (with some managed code) that had mutated over the past ten years into a complex and difficult-to-modify codebase.  Now, after over five years of work, Roslyn is almost finished, and has a [public preview](http://roslyn.codeplex.com) available.

#Why rewrite everything?

 - The native compilers were so complicated that even simple language changes required enormous amounts of work.  The new managed compilers have a much better design which makes changes easy.  (note that actually designing a good language feature is still a great deal of work)
 - The native compilers were completely closed, so that any other component that needed to parse C# or VB source (eg, the editor, the Razor compiler, and certain Visual Studio services) each required separate parsers for C# and VB.
 - Because C# and VB have different histories and origins, the implementations of the native compilers and IDE services were completely different, involving a lot of logic that needed to be written (and maintained) twice for not good reason.  This also led to lots of pointless inconsistencies in the way the editor behaves (eg, code snippets).
 - Because the compilers didn't expose any information about what they were compiling, implementing VS refactoring tools required a great deal of work to reproduce the semantic meaning of the code being refactored.  This is the primary reason that VS has so few refactorings, and that they've barely changed in nearly ten years.

#What's so cool about Roslyn?

 - Roslyn is open source!  You can browse the complete source code for the compiler toolchain at [source.roslyn.codeplex.com](http://source.roslyn.codeplex.com/), and you can even make your own contributions [on CodePlex](http://roslyn.codeplex.com/).
 - Roslyn exposes the compiler's syntax tree and semantic model, allowing you to easily write C# (or VB) code that parses a source file and explores &ndash; or even rewrites &ndash; the code.  This makes it easy to build all sorts of tools to analyze or modify source code.
 - Roslyn exposes a simple extensibility model that lets you create your own warnings or refactorings that integrate seamlessly with Visual Studio.
 - Thanks to the newly accessible semantic information, Roslyn includes a number of new refactorings, and has vastly improved the existing ones (especially Rename).

#Inside Roslyn
Roslyn has a number of layers, each of which consumes the previous layer and adds more features.

##Core Compiler Models
[Microsoft.CodeAnalysis.dll](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis/) contains the basic types and infrastructure used by both compilers, including the base types for the syntax and semantic trees, a large collection of utility classes, and the code-generation infrastructure.  This includes all parts of the compilation & analysis processes that are not language-specific.

##Language-specific compilation code
[Microsoft.CodeAnalysis.CSharp.dll](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.CSharp) and [Microsoft.CodeAnalysis.VisualBasic.dll](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.VisualBasic) contain the concrete implementations of the VB & C# compilers, building on top of Microsoft.CodeAnalysis.dll to implement language-specific logic.  These assemblies include parsers, concrete syntax and semantic tree types, and all of the actual compilation logic for their respective languages.

These assemblies are invoked by the compiler applications to actually compile code, and can be used directly to parse & explore the syntax or semantic trees.

##Actual compilers
This layer includes the applications that you actually invoke to compile code, including [rcsc.exe](http://source.roslyn.codeplex.com/#rcsc) and [rvbc.exe](http://source.roslyn.codeplex.com/#rvbc) (the Roslyn versions of the command-line compilers), [Roslyn.Compilers.BuildTasks.dll](http://source.roslyn.codeplex.com/#Roslyn.Compilers.BuildTasks) (the MSBuild task invoked from project files), and [VBCSCompiler.exe](http://source.roslyn.codeplex.com/#VBCSCompiler) (the compilation server process that actually runs the compilation code for the MSBuild task to avoid JIT delays; see part 2).

These projects are surprisingly small.  Since all of the actual work happens in the previous layer, all they do is parse the command-line options, then invoke the compilation DLLs.  (The MSBuild task is more complicated, since it needs to launch & communicate with the compilation server)

##Workspaces
The previous layers take a very localized view of C# and VB code.  They don't know anything about Visual Studio, or even project files; instead, they operate on raw source code, bundled in a `Compilation` object that keeps track of all of the code being compiled, as well as compiler-level options like referenced assemblies.

The Workspaces layer ([core](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.Workspaces), [C#](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.CSharp.Workspaces), and [VB](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.VisualBasic.Workspaces)) implements the higher-level development experience expected from an IDE.  This includes a number of concepts:

 - Immutable [`Project`](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.Workspaces/Workspace/Solution/Project.cs) and [`Solution`](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.Workspaces/Workspace/Solution/Solution.cs) types, containing collections of source files and references, just like you work with in Visual Studio.
 - A [`Workspace`](http://source.roslyn.codeplex.com/#Microsoft.CodeAnalysis.Workspaces/Workspace/Workspace.cs) class that contains a solution and manages changes (this is the mutable outer shell around the immutable projects & syntax trees).
 - Support for workflow features that are not actually part of the languages, such as loading MSBuild project files and parsing compiled XML doc comment files.
 - Implementations of basic IDE-level services such as source formatting, Find All References, rename, syntax highlighting, recommendations (the core parts of IntelliSense), code formatting, and a few other basic services for code editing. 

Most importantly, these assemblies are still completely decoupled from Visual Studio, so you can easily use them to create your own IDE-like experiences.

_All layers below this point are not open-source._
##Features

The Microsoft.CodeAnalysis.(CSharp|VisualBasic).Features assemblies implement advanced IDE features.  These include the public base types to implement refactorings and diagnostics, as well as (as internal types) all of the refactorings & quick fixes in Visual Studio.

These assemblies are still decoupled from Visual Studio, so you can use them too in your own independent projects.  (using MEF to import all of the internal implementations of the built-in services)

##EditorFeatures
This layer actually connects all of the earlier layers to Visual Studio's editor system, implementing VS editor services and invoking all of the features from the previous layers.  This also includes features that are tied directly to Visual Studio, such as debugger integration and Edit-and-Continue.

This layer also implements other Visual Studio editor-based features that are tied to the language services, such as Metadata As Source, Peek Definition, Call Hierarchy, and more.

The only public APIs in this layer are a set of extension methods in Microsoft.CodeAnalysis.EditorFeatures.Text.dll that link Visual Studio APIs to Roslyn APIs, providing connections between VS `ITextBuffers` and Roslyn `Document`s.  If you want to write normal VS extensions that consume Roslyn APIs (as opposed to Roslyn extensions like refactorings or diagnostics, which aren't tied to Visual Studio at all), you will need this assembly to bridge the gap.

Unfortunately, this assembly cannot be found on NuGet, so you'll need to reference it yourself from the Roslyn End-User Preview installation.  (AppData\Local\Microsoft\VisualStudio\12.0\Extensions\\&hellip;)

This layer also contains some features, such as outlining, that are not intrinsically tied to VS.  With some effort, it may be possible to use these features outside of VS, using MEF to get everything hooked up.  (this would likely require setting up the editor DLLs with MEF)

##LanguageServices
Finally, Microsoft.VisualStudio.LanguageServices.dll (and the corresponding C# & VB DLLs) contains other, non-editor-related Visual Studio integrations, including the project system, object browser, options pages, and all of the other gory details of the various ways that Visual Studio interacts with the language services.

This layer is even less externally useful than EditorFeatures; it's entirely coupled to ugly VS implementation details.  Its only useful public type is the `VisualStudioWorkspace` class, which extends the core Roslyn `Workspace` with VS-specific integration methods to get projects, display definition & FAR results, and a few other things.

[_Next time: Inside the End-User Preview_]({% post_url 2014-05-21-exploring-roslyn-part-2-inside-end-user-preview %})
