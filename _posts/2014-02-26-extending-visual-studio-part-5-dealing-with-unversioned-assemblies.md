---
title: "Extending Visual Studio, part 5: Dealing with Unversioned Assemblies"
layout: "post"
categories: [visual-studio, vs-extensions, C#]
---
[Last time]({% post_url 2014-02-25-extending-visual-studio-part-4-writing-cross-version-extensions %}), I talked about how to write Visual Studio extensions that work in multiple versions of Visual Studio, using the built-in assembly redirects.

Using unversioned assemblies is trickier.  The most straightforward approach is to release a separate VSIX extension for each version of Visual Studio.  This is the approach taken by [Web Essentials](http://vswebessentials.com/), especially because it tends to be very tightly coupled to version-specific features within the web tools assemblies.  However, this makes it much more annoying to maintain the separate codebases.

An alternative approach, [taken by VsVim](https://github.com/jaredpar/VsVim/tree/master/Src/VsSpecific), is to put all code that uses unversioned assemblies in a separate project for each supported VS version.  The primary extension assembly would then check the VS version at runtime to only load the wrapper assembly for the current version of Visual Studio.  This approach is most convenient if you're only using small bits of functionality from the unversioned assemblies, so that they can easily be abstracted out.

Finally, you can reference the assembly directly, then make sure that VS loads the correct version at runtime.  This requires careful extra work to make sure that VS always ends up loading the correct assembly.

If you're only using the unversioned assembly in XAML (eg, for themed controls from Microsoft.VisualStudio.Shell.ViewManager), you can simply reference the assemblies directly.  As long as you don't specify the version when declaring the `xmlns:` in your XAML file, the XAML will be compiled with a partial assembly name, and the runtime will bind it to the already-loaded assembly from the current VS version.

If you're using it in code, this technique will not work.  The C# compiler will always emit the full names of referenced assemblies, including the version number (taken from whatever version of the DLL the compiler loaded).  Instead, you can [redirect the assembly load at runtime]({% post_url 2013-12-25-redirecting-assembly-loads-at-runtime %}) with an `AssemblyResolve` handler, allowing your code to handle the request for the mis-versioned assembly and load the correct version instead.

The caveat in this approach is that you must add the AssemblyResolve handler before VS tries to load any type from the unversioned assembly.  Otherwise, the CLR assembly loader will try to load the wrong version before you can catch it, and nothing will work.  Even worse, because assembly loads are cached, once it fails to load the assembly once, it will never try again, even after you add your handler.  

In particular, if your VSIX DLL exports MEF types (A `MefComponent` asset), the MEF catalog will call `Assembly.GetTypes()` to find all exports and imports, before any of your code has a chance to run.  If any type in your assembly (including compiler-generated types for lambda expressions or iterators) has a field with a type from an unversioned DLL, the CLR will try to load that DLL immediately, and everything will break.  

One way to solve this problem would be to write a module initializer that adds your handler as soon as your DLL is loaded, before the call to `GetTypes()`.  Unfortunately, C# does not support module initializers, so unless you want to add a post-build step that uses ilasm & ildasm to inject an initializer by hand, this won't help.

Instead, you simply need to make sure that you don't have any types that directly reference unversioned assemblies.  Make sure that you don't have any fields (or base classes) of types from unversioned assemblies, and that you don't use variables of those types in iterator methods or capture them in lambda expressions.  If you violate this rule, your extension will fail with a `TypeLoadException` on any version of Visual Studio other than the version of the unversioned assembly that you bound to.

If you're getting this exception, you can run the following code in [LINQPad](http://linqpad.net) to figure out what types are causing problems:

```csharp
const string BasePath = @"C:\Path\To\Solution";
const string ReferencesPath = BasePath + @"References\v10.0\";

// Load the assembly containing the types to test
var targetAssembly = Assembly.LoadFrom(BasePath + @"YourProject\bin\Debug\YourProject.dll");

// Load the versioned assemblies that VS will load successfully
Assembly.LoadFrom(ReferencesPath + "Microsoft.VisualStudio.Shell.10.0.dll");
Assembly.LoadFrom(ReferencesPath + "Microsoft.VisualStudio.Text.Data.dll");
Assembly.LoadFrom(ReferencesPath + "Microsoft.VisualStudio.Text.UI.Wpf.dll");

Type[] successfulTypes;
try {
	// Try to load the types without the unversioned assemblies
	targetAssembly
		.GetTypes()
		.Select(t => t.FullName)
		.Dump("Loaded types");
	Console.WriteLine("All types loaded successfully!");
	return;
} catch (ReflectionTypeLoadException ex) {
	successfulTypes = ex.Types;
	ex.LoaderExceptions.Select(e => new {
		Message = e.GetType().Name + ": " + e.Message,
		FusionLog = e is FileNotFoundException ? Util.OnDemand("Full Log", () => ((FileNotFoundException)e).FusionLog) : null
	}).Dump("Load Errors");
}

// Load the unversioned assemblies that will be handled by AssemblyResolve
Assembly.LoadFrom(ReferencesPath + "Microsoft.VisualStudio.CSharp.Services.Language.dll");

targetAssembly
	.GetTypes()
	.Except(successfulTypes)
	.Select(t => t.FullName)
	.Dump("Failed types");
```

Note that you will need to reset the query's AppDomain (Ctrl+Shift+F5 in LINQPad) after you run it so that the unversioned assemblies won't be loaded next time.

_Next time: Tips from the trenches_