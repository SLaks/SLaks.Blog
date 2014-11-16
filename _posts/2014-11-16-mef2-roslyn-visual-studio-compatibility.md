---
title: "MEF v2, Roslyn, and Visual Studio: An Adventure in Compatibility"
layout: "post"
categories: [visual-studio, vs-extensions, Roslyn]
---

#Background
Both Visual Studio and Roslyn use the [Managed Extensibility Framework](https://mef.codeplex.com/) (MEF) to build large applications out of decoupled, extensible components.  MEF allows different parts of these programs to talk to each-other using clearly defined interfaces, allowing different subsystems to be developed by different teams on different release cycles without breaking anything.

MEF is also used for extensibility.  Visual Studio uses MEF to import services like syntax highlighting, IntelliSense providers, and other editor services; Roslyn uses MEF to import refactorings and diagnostics.  This allows you to `[Export]` these services in your own extensions, and have Visual Studio or Roslyn automatically import and use them just by loading your DLL.  This is the core of [modern Visual Studio extensibility](/2013-11-10/extending-visual-studio-part-2-core-concepts/#editor-extensions).  Both Roslyn and Visual Studio also use MEF for hundreds of internal services, to help wire up core functionality even without being extensible.  The core compilation engine (including the syntax trees and semantic model) do not use MEF at all, but the workspaces layer uses it for services like caching layers, as well as formatting rules and language-specific APIs to create core concepts like compilations.  The Visual Studio & editor integration layers use hundreds of their own MEF services to wire up their own implementations.

#The Problem
The core parts of Roslyn (the compilers & syntax / semantic APIs, and the basic workspace services) were recently changed to be portable assemblies, allowing them to be used in Windows Store apps as well.  The original version of MEF (System.ComponentModel.Composition.dll) is not a portable assembly, so the Roslyn team switched to MEF v2 instead.  MEF v2 is released as a NuGet package named [Microsoft.Composition](https://www.nuget.org/packages/Microsoft.Composition), which contains portable (PCL) assemblies that solve all of these problems.  You can see more details about the change in [this commit](https://roslyn.codeplex.com/SourceControl/changeset/e76a29a4)  (this commit [broke Roslyn's CodePlex sync tool](https://twitter.com/jasonmalinowski/status/533995505186271233), so you can only see the files changed on [GitHub](https://github.com/mono/roslyn/commit/e76a29a4) or a local clone).

However, Visual Studio itself cannot move away from MEF v1, because that would break every existing extension that exports any service using the MEF v1 `[Export]` attribute.  Roslyn's Visual Studio integration (especially editor services like syntax highlighting) need to export VS editor services (eg, `IClassifierProvider`) to Visual Studio's MEF host, while at the same time importing Roslyn workspace services which are exported using MEFv2, and never the twain shall meet.

#The Solution
The Visual Studio 2015 Preview is the first public VS build to suffer from the problem (Dev14 CTP 4 was built before Roslyn switched to MEFv2).  To fix it, Visual Studio has its own internal version of MEF (usually referred to as MEF v3 or VsMEF), contained in Microsoft.VisualStudio.Composition.dll.  This version of MEF scans assemblies for both MEFv1 exports and MEFv2 exports, loading them all into a single unified container.

This solves all of the problems.  This new MEF container picks up MEFv1-exported types from existing extensions and from the rest of Visual Studio, and can seamlessly mix them with MEFv2-exported types from Roslyn.  As long as you [don't mix attributes from different MEF versions](http://source.roslyn.codeplex.com/#Roslyn.Diagnostics.Analyzers/Reliability/MixedVersionsOfMefAttributesAnalyzer.cs) in the same class, everything will just work.  This change is so transparent that extension developers won't even notice it unless they go out and look for it; I only discovered it because it completely broke my out-of-process VS MEF host in [VSEmbed](https://github.com/SLaks/VSEmbed).

This also means that you can use MEFv2 instead of MEFv1 in VS2015 extensions, taking advantage of new features like [open generic parts](http://blogs.msdn.com/b/bclteam/archive/2011/10/27/what-s-new-in-mef-version-2-preview-4.aspx).  Note that older versions of Visual Studio will completely ignore MEFv2 attributes.  You can utilize this to create parts that will only be imported by VS2015, by using the MEFv2 `[Export]` attribute on only those parts in a backwards-compatible extension.  Note, however, that you can't use any new types or assemblies in class members, or older versions will fail to load them as MEFv1 tries to scan every type for its attributes.

MEF v3 also has other benefits, including [faster loading](https://twitter.com/aarnott/status/534035831539785730) and [better error messages](https://twitter.com/aarnott/status/534037832721911808) when things go wrong.

MEF v3 will [hopefully](https://twitter.com/aarnott/status/534036403022077953) be published standalone on NuGet some time in the future.
