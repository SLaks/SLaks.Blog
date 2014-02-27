---
title: "Extending Visual Studio, part 4: Writing cross-version extensions"
layout: "post"
categories: [visual-studio, vs-extensions, C#]
---
[Last time]({% post_url 2014-02-21-extending-visual-studio-part-3-assembly-versioning %}), I talked about the different approaches that Visual Studio takes toward assembly versioning.  

Navigating this mess and producing a version-independent VSIX requires careful planning.  The first step is to pick a minimum version of Visual Studio that you want to support.  Your extension cannot use features or APIs that were introduced after this version.  For most extensions, the minimum version would be VS2010, which introduced both the VSIX extension manager and the new WPF editor.  However, if you want to extend newer features, such as Peek, the new CSS or HTMLX editors, or Roslyn, you will need to require a later minimum VS version.

Note that the format for VSIX manifests changed in VS2012.  If you want to create an extension using VS2012 or later, and have it work on VS2010, you will need to manually rewrite the `Source.extension.vsixmanifest` file to use version 1 of the XML schema (this will break the designer).  You can do that by copying the manifest from an existing 2010-compatible extension, such as [mine](https://github.com/SLaks/Rebracer), and editing all of the fields to match your extension.  In particular, make sure to change the unique extension ID (this does not actually need to be a GUID; it can be convenient to place your extension's name before the GUID to gain both uniqueness and readability).

Obviously, your extension cannot reference any immutable assemblies newer than your minimum VS target version.  However, it is perfectly fine to add a reference to an immutable assembly installed with a newer version of VS; they are, after all, immutable.

When using versioned assemblies, you need to make sure that you don't accidentally use APIs introduced in newer versions of VS.  You also need to make sure that your extension is compiled only against the minimum versions of versioned assemblies; otherwise, it will still fail to load on older VS versions  (the `<bindingRedirect>`s only redirect older versions, not newer ones).

To solve both of these problems, you need to make a local copy of the minimum versions of any versioned assemblies that you reference (typically in a folder named `References` under source control, and ideally in a subfolder by VS version for clarity).  You can find these assemblies from any installed copy of the older VS versions (including Express Edition), or online from other open source projects that maintain this kind of compatiblity, such as [VsVim](https://github.com/jaredpar/VsVim), [NuGet](https://nuget.codeplex.com), or [Rebracer](https://github.com/SLaks/Rebracer).  You must also add that directory to the `ReferencePaths` setting in the project to tell the compiler to find the DLLs from that folder; otherwise, the project won't build if the older VS version isn't installed.  You can do this [directly in the csproj file](https://github.com/jaredpar/RoundTripVSIX/commit/12003ab6a13c2fa3d017863f2f11496b7cb04425) or in Project Properties in the Reference Paths section.

[_Next time: Using unversioned assemblies_]({% post_url 2014-02-26-extending-visual-studio-part-5-dealing-with-unversioned-assemblies %})