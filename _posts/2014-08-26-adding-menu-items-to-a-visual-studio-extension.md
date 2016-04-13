---
title: "How to add a menu item to a Visual Studio extension"
layout: "post"
categories: [visual-studio, vs-extensions, C#]
---

As I've described [earlier]({% post_url 2013-11-10-extending-visual-studio-part-2-core-concepts %}), when creating a Visual Studio extension, you are given a choice between the older VsPackage-style extension (using a wizard from the New Project dialog) and the newer, MEF-based extensions.

Newer parts of VS, such as the editor, the Web Tools, or Roslyn, are built using MEF, so an extension simply needs to export MEF services for these components to import & run.  These MEF-based extensions are much simpler and easier to work with.  However, if you create an MEF-based extension (eg, from a Roslyn or editor extension template), there is no obvious way to add a menu command.  This blog post explains how to do that.

You can follow along in your own extension, or you can see all of these changes in [this commit](https://github.com/SLaks/Ref12/commit/6ce75a4d7f4bfde5c3c51073ebb9db97baa67f42) in Ref12.

# 1. Add a menu resource file
Visual Studio menu commands are compiled from `.vsct` files, which are compiled by the VSCT compiler into embedded `.ctmenu` resources within the DLL.  To get started, you need to add a `.vsct` file (the name doesn't matter) to your project as a `<VSCTCompile>` tag.  This must be done by editing the project file directly.  You'll also need to add an empty `VSPackage.resx` file for the VSCT compiler to embed the compiled resource into

The project file modifications (add these into any `<ItemGroup>`) are as follows:
```xml
	<VSCTCompile Include="YourName.vsct">
		<ResourceName>Menus.ctmenu</ResourceName>
	</VSCTCompile>
	<EmbeddedResource Include="VSPackage.resx">
		<MergeWithCTO>true</MergeWithCTO>
		<ManifestResourceName>VSPackage</ManifestResourceName>
	</EmbeddedResource>
```

The contents of the VSCT should look like this:

```xml
<?xml version="1.0" encoding="utf-8"?>
<CommandTable xmlns="http://schemas.microsoft.com/VisualStudio/2005-10-18/CommandTable" xmlns:xs="http://www.w3.org/2001/XMLSchema">
	<Extern href="stdidcmd.h"/>
	<Extern href="vsshlids.h"/>
	<Commands package="PackageGuid">
		<Buttons>
			<Button guid="CommandsGuid" id="MyCommand" priority="0x0101" type="Button">
			<Parent guid="guidSHLMainMenu" id="IDG_VS_CODEWIN_NAVIGATETOLOCATION"/>
			<Icon guid="guidObjectBrowserButtons" id="15"/>

			<Strings>
				<ButtonText>My &amp;Powerful Command</ButtonText>
			</Strings>
			</Button>
		</Buttons>
	</Commands>

	<Symbols>
		<GuidSymbol name="PackageGuid" value="«Package GUID»" />

		<GuidSymbol name="CommandsGuid" value="«Command Group GUID»">
			<IDSymbol name="MyCommand" value="0" />
		</GuidSymbol>
	</Symbols>
</CommandTable>
```

The command ID values must be unique within each command group (GUID), so you don't need to worry about colliding with other commands.

The `<Parent>` entry specifies the group that the command should be placed in; you can find all standard groups in Program Files\Microsoft Visual Studio 12.0\VSSDK\VisualStudioIntegration\Common\Inc\vsshlids.h.  You can also find a list of all command IDs in stdidcmd.h in the same folder.

# 2. Define a VSPackage for Visual Studio to load
To make Visual Studio load your menu command file, you need to define a VSPackage within your addin and register it in the VSIX.

First, add the following code file (the class name does not matter):

```csharp
using System;
using System.Runtime.InteropServices;
using Microsoft.VisualStudio.Shell;

namespace YourAddin.Namespace {
	// These GUIDS and command IDs must match the VSCT.
	[ProvideMenuResource("Menus.ctmenu", 1)]
	[Guid("«Package GUID»")]
	[PackageRegistration(UseManagedResourcesOnly = true)]
	class YourAddinPackage : Package {
	}

	[Guid("«Command Group GUID»")]
	enum YourAddinCommand {
		MyCommand = 0
	}
}
```

The attributes in the package class tell CreatePkgDef.exe (which is invoked by the VSIX compiler) how to emit a `.pkgdef` file in your addin that sets he appropriate registry keys to register the addin and its menu resource with the Visual Studio's native COM-based addin system.  This is completely independent of MEF registration for managed addins.

The enum and its `[Guid]` attribute are simply a convenient way of keeping track of the GUID and command IDs; you're free to use a different approach if you like.

You also need to tell the VSIX to include the package and generate the pkgdef file by adding the following line to the `<Content>` element in your source.extension.vsixmanifest:

```xml
		<VsPackage>|%CurrentProject%;PkgdefProjectOutputGroup|</VsPackage>
```

If you're using the designer (for version 2 VSIXes), go to the Assets section, click New, select `Microsoft.VisualStudio.VsPackage`, `A project in the current solution`, and select your project.

# 3. Fix the project configuration
Finally, you need to make a few changes to the csproj file to correctly register the addin:

First, delete `<GeneratePkgDefFile>false</GeneratePkgDefFile>` if it's present to tell the VSIX compiler to generate a pkgdef to register your package.  Purely MEF-based addins don't need pkgdef files at all, so most project templates will add that, but once you create a VSPackage, you need a pkgdef to register it with Visual Studio's native COM addin loader.

Next, add the following markup anywhere in the root element (not in an `<ItemGroup>`):
```xml
	<PropertyGroup>
		<UseCodebase>true</UseCodebase>
	</PropertyGroup>
```

VSPackages are actually COM DLLs that are registered in the Visual Studio hive's config key and loaded using normal COM practices.  Managed VSPackages are loaded using COM interop; they are registered as `mscoree.dll`, which then looks up a managed assembly to load from the same registry key.  By default, the PkgDef creator will emit `"Assembly"="YourAssemblyName"`, which mscoree will try to load using the standard .Net assembly loader.  Unless your VSPackage DLL is in the GAC (which it won't be), this won't work, and VS will silently refuse to load your package.  Setting `<UseCodebase>` in the project file will make it emit `"CodeBase"="$PackageFolder$\YourAddin.dll"` (`$PackageFolder$` is substituted for the actual DLL path when the VSIX is installed), which tells mscoree the exact path to load it from.

# 4. Implement the command
After doing all this, your command should show up when you hit F5 in the addin (running in the Experimental instance).  However, you still need to actually implement the command so that something will happen when the button is clicked.

For global commands, the simplest way to do this is to override the `Initialize()` method in your package and add code like the following:

```csharp
var mcs = (OleMenuCommandService) GetService(typeof(IMenuCommandService));
var commandId = new CommandID(typeof(YourAddinCommand).GUID, (int)YourAddinCommand.MyCommand));
mcs.AddCommand(new MenuCommand(delegate {
	MessageBox.Show("You clicked me!");
}, commandId);
```

For commands that apply to the active editor window, I wrote a class which adds an interceptor to the editor's command handler chain, and exposes a simple interface that accepts an entry in a command enum.  This can be used both to implement new commands and to intercept existing ones.
You can find it at [CommandTargetBase.cs](https://github.com/SLaks/Ref12/blob/master/Ref12/Commands/CommandTargetBase.cs), and you can see sample usage [here](https://github.com/SLaks/Ref12/blob/master/Ref12/Commands/TextViewListener.cs).

