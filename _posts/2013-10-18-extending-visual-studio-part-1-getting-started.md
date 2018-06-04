---
title: "Extending Visual Studio 2013, Part 1: Getting Started"
layout: "post"
categories: [visual-studio-2013, vs-extensions]
---

In addition to being an excellent development environment, Visual Studio also has a powerful extensibility system.  In this blog post, I will explain how to start writing Visual Studio extensions, so you can make the IDE work the way you want it to.

# Getting Started
To use or develop extensions, you need Visual Studio Professional or higher (Express Edition won't work).

First, download and install the [Visual Studio SDK](https://www.microsoft.com/visualstudio/eng/downloads#d-vs-sdk) (for VS2012, see [here](https://www.microsoft.com/en-us/download/details.aspx?id=30668); this adds project types for Visual Studio extensions and is required in order to open or create any extension.

Next, you need to decide whether to add features to an existing open source extension or create a brand new extension.

 - [**Web Essentials**](http://vswebessentials.com/)  
Web Essentials, by [Mads Kristensen](https://twitter.com/mkristensen), is a collection of (mostly) web-related enhancements to Visual Studio.  It includes lots of new IntelliSense completions (especially for CSS), new BrowserLink features, automatic JSHint for Javascript files, new warnings for HTML and CSS, and many other features.  Any web-related functionality you want to add should probably go here.
 - [**SideWaffle**](http://sidewaffle.com/)  
SideWaffle is collection of code snippets and templates (both single files and entire projects) for popular frameworks (Chrome extensions, Angular apps, Azure interactions, etc...).  If you simply want to make a new template to create a preconfigured file or project, SideWaffle is the way to go.  See [this video](https://youtu.be/h4VaORKgrOw) for detailed instructions.
 - Your Name Here  
If you want to create something that doesn't fall into one of these categories, or if you're creating something complex enough (or specialized enough) that it wouldn't fit in Web Essentials, you can create your own extension, and upload it to the [Visual Studio Gallery](https://visualstudiogallery.msdn.microsoft.com/) yourself.  
To start from scratch, click File, New Project, select, Visual C# (or VB), Extensibility, then create a VSIX project.  This will create an empty extension; you can also select one of the pre-built templates if they match your needs:  
  <br />
  ![Extensibility Project Templates](/images/2013/vs-new-extension-project.png)

If you want to extend an existing extension, you'll need to create an account on [GitHub](https://github.com) and fork the project to your account so that you can push your changes.  Then, clone the project to your computer ([GitHub for Windows](https://windows.github.com/) is an easy way to do this; [SourceTree](https://www.sourcetreeapp.com/) is more powerful) and start making changes.  Make sure to commit to every time you finish working on something so you have a nice history; you can do this [directly from Visual Studio](https://msdn.microsoft.com/en-us/library/vstudio/hh850437) or in the aforementioned applications.  Finally, once your feature is finished and tested, open a pull request on GitHub to ask the project maintainer to merge in your changes.

> ##Side Note: Tips for contributing with git
> The pull request model work best with _feature branches_ &ndash; making a separate branch for each contribution.  Before starting each feature, you'll want to create a new branch, reset that branch to the latest version of the original (upstream) project, then make changes from there.  
> 
> This is easiest to do on the git command line.  First of all, if you aren't already, use [posh-git](https://dahlbyk.github.io/posh-git/) to get nice tab completion for git commands and branch names.  (GitHub for Windows includes this if you use PowerShell; git bash has a similar feature)
> 
> First, you need to add the upstream repository as a remote (an external git repository that you can pull from) so that you can pull changes directly from the original project to your machine.  This only needs to be done once:
> 
> ```sh
> git remote add upstream <url>
> ```
> `upstream` is the name of the new remote; `<git-url>` is the `https://github.com/...` URL of the _original_ repository.  You can find this URL on the right side of the project on GitHub.com:
> 
> ![GitHub clone URL](/images/2013/github-clone-url.png)
> 
> Once you've added the remote, run the following commands to make a new branch and reset to the original state.  
> **Warning**: This will blow away all uncommitted changes! Only do this after committing everything you've been working on.

> ```sh
> git fetch upstream
> git checkout -b my-awesome-feature
> git branch reset upstream/master --hard
> ```

> You're now ready to begin working on the new branch.  If the upstream project changes in the meantime, you can run the following commands to merge in the changes without breaking history: (make sure to commit everything first)
> 
> ```sh
> git fetch upstream
> git rebase upstream/master
> ```
> `git rebase` will rewrite the history of your local branch to include the upstream changes before your new commits.  This way, when you make the pull request, all of your commits will extend the tip of the original repository, avoiding complex merge issues.

> Since this rewrites history, if you've already pushed the branch to your fork on GitHub, your next push will need the `-f` flag to overwrite the existing remote history.

# Visual Studio Extensibility Basics
Visual Studio is a 10+ year old codebase built on a mix of technologies new and ancient.  Most of the older portions of Visual Studio, including the project system and the command dispatcher, are written in native code and support extensibility using ugly COM and GUIDs.  Newer parts of Visual Studio are usually written in managed code (the big exception being the new Javascript language service, which is written in C++ around IE's Chakra engine), and are thus easier to extend.

In particular, the editor was completely rewritten in Visual Studio 2010, and is implemented entirely in C# code using WPF.  This new editor uses the [Managed Extensibility Framework (MEF)](https://msdn.microsoft.com/en-us/library/vstudio/dd460648) to load and execute all of its internal components, making it very friendly for extensions.  You can write classes that implement interfaces from the editor and export them using MEF, and the editor will automatically import and run them when it loads appropriate documents.  Similarly, you can import interfaces from the editor to gain access to existing services like colorization and error checking for use within your extension.

[_Next time: Core concepts_]({% post_url 2013-11-10-extending-visual-studio-part-2-core-concepts %})