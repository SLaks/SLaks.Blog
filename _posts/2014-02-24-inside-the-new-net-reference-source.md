---
title: "Exploring the new .Net Reference Source Code"
layout: "post"
categories: [.Net, C#, reference-source]
date: 2014-02-24T13:23:00-5:00
---

Seven years ago, Microsoft released the .Net Reference Source Code, containing source for much of the .Net BCL for use with debugging.  You could configure Visual Studio to use Microsoft's public symbols servers, then step into the actual source code of .Net methods and see what's going on under the hood.

While this was, in theory, extremely useful, it had a number of limitations that made it far less useful.  A number of the source files were blank, or simply missing entirely.  The source code had been filtered by a poorly-made scrubber to remove all employee names, including those in actual source, resulting in lines like `lock (s_[....])` or `private void [....]()`.  The debug symbols were rarely updated after .Net patches were released, so debugging wouldn't work after installing updates to .Net.  Most annoyingly, there was no way easy to browse the code independently to read the source for a particular type.

Today, thanks to the efforts of [Kirill Osenkov](https://twitter.com/KirillOsenkov), [Alok Shriram](https://twitter.com/AlokShriram), and others, Microsoft has redone the source release and solved all of these problems.  The new version includes almost all of the actual source files, including things like attributes or enums that weren't in the old releases.  The scrubbing process has been fixed to only process comments & string literals so that all of the source files are syntactically correct.  The release process has been simplified so that new symbols can be published for every .Net update.  

Most importantly, you can now download a [50MB zip file](https://referencesource.microsoft.com/download.html) containing all of the source files with their original structure, complete with csproj (and vbproj) files that you can open in VS.  For the first time, you can open the .Net source code in VIsual Studio, and browse the source with the full VS experience, including Go To Definition, Find All References, quick search, and all of the other VS browsing features.  

These are not the original csproj files from the actual BCL build, and nothing will actually compile.  The compilation process for the BCL projects is far more complicated than a simple build, including auto-generated localization (SR) files, bits of native code, and various other specialized tools, including MSBuild magic for [cyclic dependencies](https://blogs.msdn.com/b/kirillosenkov/archive/2013/11/23/circular-assembly-references-in-the-net-framework.aspx).  However, they're perfect for browsing within VS.

# Reference Source Browser
<a href="/images/2014/reference-source-browser.png" target="_blank"><img src="/images/2014/reference-source-browser.png" alt="Reference Source Browser" style="float: right; max-width: 40%" /></a>
However, the crown jewel of the new release is the new online source browser.  Kirill Osenkov used Roslyn to create a wonderful web app that presents the full source code in an easily browsable fashion.  You can search for 
any class or function name, then see complete syntax-highlighted source code right in your browser, without having to download or install anything (the search engine is actually more powerful than that; see the [home page](https://referencesource.microsoft.com/) for more details).  You can explore more directly by clicking any project from the home page to see all of the source files in that project.  You can even see a full list of types in each project by namespace (click the namespace icon in any file), perfect for discovering little-known types in large assemblies.

Inside a source file, the true power of this tool is available.  You can click any class or function name anywhere to immediately jump to its definition, allowing you to quickly discover exactly what obscure or internal methods do when trying to understand a complicated procedure (you can then hit Back to jump right back to where you were before).  If you're looking at a definition, you can click on it to see all references to that class or member anywhere in all of the reference source, allowing you to quickly see how complicated features are used, or to see where an internal API is surfaced.  Because this is produced by the full Roslyn toolchain, this works with all references, including less-obvious ones like extension methods, type-inferred lambda expressions, etc.

As you navigate through the source, the URL will update to point to that exact file, so that you can always share the URL with other people to show what you're looking at (this also works for Find All References).  You can also click any line number to get a URL pointing that line (just like GitHub), perfect for showing people a particular piece of code.

Some parts of the .Net framework do not have source code in the browser, either because they're written in C++/CLI (which Roslyn cannot parse), or because the relevant product teams have not yet completed the bureaucracy required to release the source publicly.  To preserve Go to Definition within these projects, the source browser includes source from metadata for them (just like you get when from Go to Definition in Visual Studio, and in fact powered by the same Roslyn-based code).  In the list of projects on the homepage, the ones without actual source simply have the DLL file as the filename, instead of the path to the `.csproj` file.

# Visual Studio Integration
The one shortcoming of the new release is that you can't jump directly to the source of a function from within Visual Studio.  When debugging, you can step into functions that you call using the debug symbols, but you cannot quickly see the source as you write code in the first place.

To solve that, I created a Visual Studio extension called [**Ref12**](https://visualstudiogallery.msdn.microsoft.com/f89b27c5-7d7b-4059-adde-7ccc709fa86e).  After installing this extension on Visual Studio 2010 or later, you can press F12 on any function in the .Net class libraries and jump to the reference source for that function in your default browser (if you're at Microsoft and actually working on the .Net framework, the extension won't get in your way).

<img src="https://i1.visualstudiogallery.msdn.s-msft.com/f89b27c5-7d7b-4059-adde-7ccc709fa86e/image/file/125181/1/ref12%20screenshot.png" alt="Ref12 Screenshot" style="max-width: 100%" />

# Easter Eggs
There are also a number of hidden URLs in the reference source containing additional stats:

 - https://referencesource.microsoft.com/i.txt contains stats for the overall index, including line count (over 6 million!) and more
 - https://referencesource.microsoft.com/mscorlib/i.txt (and for other projects) contains those same stats for individual projects
 - https://referencesource.microsoft.com/Projects.txt contains a list of project files (or DLL files from assemblies without source) included
 - https://referencesource.microsoft.com/Assemblies.txt contains a list of all assemblies in the source, along with the index for that project in Projects.txt, and the number of other projects that reference it
 - https://referencesource.microsoft.com/TopReferencedAssemblies.txt lists the number of other projects that reference each project, in descending order
 - https://referencesource.microsoft.com/System.Core/References.txt lists the assemblies that each project references
 - https://referencesource.microsoft.com/System.Core/ReferencingAssemblies.txt lists the assemblies that reference each project
 - https://referencesource.microsoft.com/System.Core/BaseMembers.txt lists, for each overriding class member, the containing assembly and unique hash of the base member that it overrides or implements
 - https://referencesource.microsoft.com/System.Core/d.txt lists every member in each assembly, including the short name, unique hash, member type, full name, and glyph index

Some of these files are useful for exploring the released source; most of the later ones are more useful for building new functionality on top of the source browser.  For more information, see my next post, which will explain in detail exactly how the source browser works.

[_Next time: Under the hood_]({% post_url 2014-02-24-dissecting-the-new-net-reference-source-browser %})