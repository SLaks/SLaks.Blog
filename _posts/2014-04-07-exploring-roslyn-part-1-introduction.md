---
title: "Exploring Roslyn, part 1: Introduction"
layout: "post"
categories: [Roslyn, .net]
---

The .Net Compiler Platform, codenamed "Roslyn", is the most ambitious project from Microsoft's Developer Division in recent years.  The C# and VB teams got together and rewrote the compilers and language services from scratch in managed code (a mix of C# and VB), replacing a horrible mess of C++ code (with some managed code) that had mutated over the past ten years into a complex and difficult-to-modify codebase.  Now, after over five years of work, Roslyn is almost finished, and is an integral part of Visual Studio 2015, [now available in preview](https://www.visualstudio.com/news/vs2015-vs).

# Why rewrite everything?

 - The native compilers were so complicated that even simple language changes required enormous amounts of work.  The new managed compilers have a much better design which makes changes easy.  (note that actually designing a good language feature still requires a great deal of design work)
 - The native compilers were completely closed, so that any other component that needed to parse C# or VB source (eg, the editor, the Razor compiler, and certain Visual Studio services) each required separate parsers for C# and VB.
 - Because C# and VB have different histories and origins, the implementations of the native compilers and IDE services were completely different, involving a lot of logic that needed to be written (and maintained) twice for no good reason.  This also led to lots of pointless inconsistencies in the way the editor behaves (eg, code snippets).
 - Because the compilers didn't expose any information about what they were compiling, implementing VS refactoring tools required a great deal of work to reproduce the semantic meaning of the code being refactored.  This is the primary reason that VS has so few refactorings, and why they've barely changed in nearly ten years.

# What's so cool about Roslyn?

 - Roslyn is completely open source!  You can browse the complete source code for the compiler toolchain and Visual Studio integration at [source.roslyn.io](http://source.roslyn.io/), and you can even make your own contributions [on GitHub](https://github.com/dotnet/roslyn).
 - Roslyn exposes the compiler's syntax tree and semantic model, allowing you to easily write C# (or VB) code that parses a source file and explores &ndash; or even rewrites &ndash; the code.  This makes it easy to build all sorts of tools to analyze or modify source code.
 - Roslyn exposes a simple extensibility model that lets you create your own warnings or refactorings that integrate seamlessly with Visual Studio.
 - Thanks to the newly accessible semantic information, Roslyn includes a number of new refactorings, and has vastly improved the existing ones (especially Rename).

# Inside Roslyn
Roslyn has a number of layers, each of which consumes the previous layer and adds more features.   As of early February 2015, the entire Roslyn stack, including the Visual Studio & debugger integration layers, is open source on GitHub.

## Core Compiler Models
[Microsoft.CodeAnalysis.dll](http://source.roslyn.io/#Microsoft.CodeAnalysis/) contains the basic types and infrastructure used by both compilers, including the base types for the syntax and semantic trees, a large collection of utility classes, and the code-generation infrastructure.  This includes all parts of the compilation & analysis processes that are not language-specific.

This layer, as well as the next three layers, is split into pairs of portable and desktop assemblies.  The portable versions are full PCL assemblies that can run on platforms that do not offer standard filesystem access, such as Windows Runtime or Windows Phone.  The `.Desktop` variants add filesystem-aware APIs, and can only run on full .Net platforms (including Mono).  For example, the portable assemblies will compile and expose syntax trees & semantic models, and the Desktop layer adds the ability to resolve referenced DLLs from disk.

## Language-specific compilation code
[Microsoft.CodeAnalysis.CSharp.dll](http://source.roslyn.io/#Microsoft.CodeAnalysis.CSharp) and [Microsoft.CodeAnalysis.VisualBasic.dll](http://source.roslyn.io/#Microsoft.CodeAnalysis.VisualBasic) contain the concrete implementations of the VB & C# compilers, building on top of Microsoft.CodeAnalysis.dll to implement language-specific logic.  These assemblies include parsers, concrete syntax and semantic tree types, and all of the actual compilation logic for their respective languages.

These assemblies are invoked by the compiler applications to actually compile code, and can be used directly to parse & explore the syntax or semantic trees.

## Actual compilers
This layer includes the applications that you actually invoke to compile code, including [csc.exe](http://source.roslyn.io/#csc) and [vbc.exe](http://source.roslyn.io/#vbc) (the Roslyn versions of the command-line compilers), [Microsoft.Build.Tasks.Roslyn.dll](http://source.roslyn.io/#Microsoft.Build.Tasks.Roslyn) (the MSBuild task invoked from project files), and [VBCSCompiler.exe](http://source.roslyn.io/#VBCSCompiler) (the compilation server process that actually runs the compilation code for the MSBuild task to avoid JIT delays; see part 2).

These projects are surprisingly small.  Since all of the actual work happens in the previous layer, all they do is parse the command-line options, then invoke the compilation DLLs.  (The MSBuild task is more complicated, since it needs to launch & communicate with the compilation server)

## Workspaces
The previous layers take a very localized view of C# and VB code.  They don't know anything about Visual Studio, or even project files; instead, they operate on raw source code, bundled in a `Compilation` object that keeps track of all of the code being compiled, as well as compiler-level options like referenced assemblies.

The Workspaces layer ([core](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces), [C#](http://source.roslyn.io/#Microsoft.CodeAnalysis.CSharp.Workspaces), and [VB](http://source.roslyn.io/#Microsoft.CodeAnalysis.VisualBasic.Workspaces)) implements the higher-level development experience expected from an IDE.  This includes a number of concepts:

 - Immutable [`Project`](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces/Workspace/Solution/Project.cs) and [`Solution`](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces/Workspace/Solution/Solution.cs) types, containing collections of source files and references, just like you work with in Visual Studio.
 - A [`Workspace`](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces/Workspace/Workspace.cs) class that contains a solution and manages changes (this is the mutable outer shell around the immutable projects & syntax trees).
 - Support for workflow features that are not actually part of the languages, such as loading MSBuild project files and parsing compiled XML doc comment files.
 - Implementations of basic IDE-level services such as source formatting, Find All References, rename, syntax highlighting, recommendations (the core parts of IntelliSense), code formatting, and a few other basic services for code editing. 

Most importantly, these assemblies are still completely decoupled from Visual Studio, so you can easily use them to create your own IDE-like experiences.

This layer too is split into desktop and portable versions.  All of the basic functionality remains in the portable assemblies; the desktop layers adds [`MSBuildWorkspace`](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces.Desktop/Workspace/MSBuild/MSBuildWorkspace.cs), which reads MSBuild `csproj` & `vbproj` files, and a couple of other desktop-specific APIs.

This layer, as well as all of the following layers, is wired together using [MEF v2](https://mef.codeplex.com/).  MEF is used to provide implementations of Roslyn internal services (especially across layers), to provide services to the Visual Studio editor system, and to import user-provided extensions.  For example, writing a custom codefix simply involves inheriting [`CodeFixProvider`](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces/CodeFixes/CodeFixProvider.cs) and exporting it via MEF using [`[ExportCodeFixProvider]`](http://source.roslyn.io/#Microsoft.CodeAnalysis.Workspaces/CodeFixes/ExportCodeFixProviderAttribute.cs) (most user-provided services have custom `[Export]` attributes that provide additional metadata).

The one exception to this rule is custom diagnostic analyzers.  The core compilation process, which invokes analyzers, does not use MEF; instead, the host passes a collection of [`AnalyzerReference`s](http://source.roslyn.io/#Microsoft.CodeAnalysis/DiagnosticAnalyzer/AnalyzerReference.cs) to the compiler (these come from Roslyn's built-in analyzers, as well as any analyzer references in your project).  Within Visual Studio, Roslyn's VS layer has a (MEF-exported) [`VisualStudioWorkspaceDiagnosticAnalyzerProviderService`](http://source.roslyn.io/#Microsoft.VisualStudio.LanguageServices/Implementation/Diagnostics/VisualStudioWorkspaceDiagnosticAnalyzerProviderService.cs) which scans for VS extensions that contain analyzers (as a separate VSIX content type), allowing you to "export" analyzers in VS extensions as if it were a MEF export.  However, since it isn't actually MEF, you can't `[Import]` things in these analyzers

## Features

The Microsoft.CodeAnalysis.(CSharp|VisualBasic).Features assemblies implement advanced IDE features.  These include the public base types to implement refactorings and diagnostics, as well as (as internal types) all of the refactorings & quick fixes in Visual Studio.

These assemblies are still decoupled from Visual Studio, so you can use them too in your own independent projects.  (using MEF to import all of the internal implementations of the built-in services)

## EditorFeatures
This layer actually connects all of the earlier layers to Visual Studio's WPF editor system, implementing VS editor services and invoking all of the features from the previous layers.  

This layer also implements other Visual Studio editor-based features that are tied to the language services, such as Metadata As Source, Peek Definition, Call Hierarchy, and more.

The only public APIs in this layer are a set of extension methods in [Microsoft.CodeAnalysis.EditorFeatures.Text.dll](http://source.roslyn.io/#Microsoft.CodeAnalysis.EditorFeatures.Text) that link Visual Studio APIs to Roslyn APIs, providing connections between VS `ITextBuffers` and Roslyn `Document`s.  If you want to write normal VS extensions that consume Roslyn APIs (as opposed to Roslyn extensions like refactorings or diagnostics, which aren't tied directly to Visual Studio at all), you will need this assembly to bridge the gap.

Unlike the previous layers, these assemblies aren't standalone; they reference the (MEF-based) Visual Studio WPF editor APIs.  However, they do not reference the rest of Visual Studio at all.  In fact, you can set up the Visual Studio editor components in a MEF container and host the entire Roslyn editor (using this layer) outside of Visual Studio.  For more details, see [VSEmbed](https://github.com/SLaks/VSEmbed), where I did exactly that.

## LanguageServices
Finally, Microsoft.VisualStudio.LanguageServices.dll (and the corresponding C# & VB DLLs) contains other, non-editor-related Visual Studio integrations, including the project system, debugger, object browser, options pages, and all of the other gory details of the various ways that Visual Studio interacts with the language services.

This layer is even less externally useful than EditorFeatures; it's entirely coupled to ugly VS implementation details.  Its only useful public type is the `VisualStudioWorkspace` class, which extends the core Roslyn `Workspace` with VS-specific integration methods to get projects, display definition & FAR results, and a few other things.

[_Next time: Inside the End-User Preview_]({% post_url 2014-05-21-exploring-roslyn-part-2-inside-end-user-preview %})
