---
title: "Extending Visual Studio, part 3: Assembly Versioning"
layout: "post"
categories: [visual-studio, vs-extensions, C#]
---

[Last time]({% post_url 2013-11-10-extending-visual-studio-part-2-core-concepts %}), I talked about the core concepts and basic assemblies within Visual Studio that are used to create extensions.  This time, I'll talk about how Microsoft manages these assemblies across Visual Studio.

One of the complex aspects of writing Visual Studio extensions is dealing with versioning issues.  Each release of Visual Studio changes the major version of all of the VS DLLs.  Without some kind of work around, VS extensions would need a separate project for each version of Visual Studio, so that it can reference the correct versions of the VS DLLs.

Visual Studio takes a number of different approaches to this problem:

##Immutable assemblies
Some VS assemblies simply never change, at all.  These assemblies have exactly one version &ndash; the version of VS that they were introduced in &ndash; and newer versions of VS continue to ship the exact same DLL.

This is the simplest, most ideal solution to the problem; extensions can simply reference these DLLs directly, and they will continue to work with all future VS versions without any problems.  However, since most VS functionality is designed to change in future versions, few parts of VS can live in immutable DLLs.  

VS includes two categories of immutable DLLs: COM interop assemblies and immutable shell assemblies.

COM interop assemblies (`Microsoft.VisualStudio.Shell.Interop.XX` and similar) contain nothing but COM interfacs (including supporting enums and structures, but with no classes at all).  Since COM does not allow existing interfaces to change, immutability isn't a problem here.  Instead, new functionality is added by creating new interfaces in newer COM assemblies (eg, `IVsSolution` through `IVsSolution5`) with additional methods.

Immutable shell assemblies (`Microsoft.VisualStudio.Shell.Immutable.XX`) contain managed types that the shell team has decided will never need to change.  They mostly comtain simple types, such as interfaces, enums, and EventArgs classes, that are used by other parts of the shell.

##Versioned assemblies
Then there are assemblies that do change, but which Microsoft officially supports for use in extensions.  In order to make ordinary Visual Studio extensions work in future versions of Visual Studio, VS includes `<bindingRedirect>`s in devenv.exe.config that redirect all older versions of these assemblies to the correct version for the installed copy of VS.  This way, extensions that reference older versions will be seamlessly redirected to the correct version on newer VS installations.  

In turn, Microsoft must make sure to never introduce breaking changes in these assemblies.  To facilitate this, versioned assemblies tend to mostly contain interfaces & officially-public APIs only; most of the implementations & internal APIs live in unversioned assemblies elsewhere (especially `Microsoft.VisualStudio.Platform.VSEditor.dll`)

Versioned assemblies include all of the public APIs for the new WPF editors (`Microsoft.VisualStudio.Text.*`), the core shell APIs (`Microsoft.VisualStudio.Shell.XX`), and a number of assemblies for specific features.  See devenv.exe.config in your VS installation directory for a full list.

##Unversioned assemblies
Finally, there are DLLs with no compatibility guarantees whatsoever.  Most other VS assemblies, especially implementation assemblies and assemblies for smaller or younger teams, are unversioned assemblies, with a separate version for each VS release and no binding redirects at all.

There is no simple way to use unversioned assemblies in a VSIX without requiring a separate project for each VS release.

_Next time: Writing cross-version extensions_