---
title: "Creating multiple Visual Studio “Profiles” with RootSuffixes"
layout: "post"
categories: [visual-studio-2013, vs-extensions]
---

When using Visual Studio, it can ocasionally be useful to have separate “profiles” &ndash; to be able to start multiple instances of Visual Studio with independent settings.  For example, if you work on multiple projects that use very different source formatting settings, you can create a separate profile for each one, allowing you to open each project with the correct settings.  If you create books or blog posts that have screenshots of Visual Studio, you can create a separate profile with pristine settings and no extensions installed, so that you can create screenshots that match the out-of-box experience.

Visual Studio supports this with the [`/RootSuffix` switch](https://msdn.microsoft.com/en-us/library/vstudio/bb166560).  If you launch Visual Studio with `/RootSuffix YourName`, it will create new settings containers in the registry and in AppData with that name (`HKCU\Software\Microsoft\VisualStudio\12.0YourName` and `<user profile>\AppData\Local\Microsoft\VisualStudio\12.0YourName`).  It will then ask you to sign in to a Microsoft account (for VS2013) and to pick a base settings file, just like launching Visual Studio for the first time.

To launch Visual Studio with a command-line parameter, type `devenv /RootSuffix YourName` into the Start menu / Start screen, then select the first result.  You can also use the command prompt (from the VS installation directory), or copy the shortcut to VS from the start menu and add the parameter to the Target field.

This feature is usually used when testing Visual Studio extensions.  VS extension projects will automatically register themselves in the `/RootSuffix Exp` hive (the "Experimental Instance"), which is launched when you hit F5.  This allows you to test your extensions without interfering with normal development.

Generally, new RootSuffixes behave identically to, and completely independent of, regular Visual Studio instances.  You can set all settings, maintain separate Recent lists, even install other extensions into the separate instance using Extension Manager.  

However, there is no way to install an extension directly from a VSIX file into a separate RootSuffix.  VSIX packages from the Visual Studio Gallery install as usual, but there is no way to install a VSIX from somewhere else (such as a private beta or a development version of an existing extension).  Double-clicking a VSIX will install it into the primary instance, the `VSIXInstaller` command-line tool has no option to specify the RootSuffix, and you cannot install a VSIX by dragging it into Visual Studio.

To solve this, I wrote a [command-line tool](https://github.com/SLaks/Root-VSIX) that installs VSIXs into any Visual Studio RootSuffix.  You can download Root-VSIX from [here](https://github.com/SLaks/Root-VSIX/releases), then install a VSIX to any VS RootSuffix on the command line:

```bat
Root-VSIX [<VS version>] <RootSuffix> <Path to VSIX>
```
