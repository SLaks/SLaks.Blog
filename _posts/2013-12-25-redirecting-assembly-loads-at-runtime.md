---
title: "Redirecting Assembly Loads at Runtime"
layout: "post"
categories: [.Net, C#, assemlies]
---

.Net's [assembly resolver](https://msdn.microsoft.com/en-us/library/yx7xezcf) (Fusion) takes assembly names (eg, `MyCompany.MyProduct, Version=2.1.0.0, , Culture=neutral, PublicKeyToken=3bf5f017df1a30a5`) and resolves them to actual DLL files, searching in the Global Assembly Cache, the folder containing the entry assembly, and any additional PrivateBinPaths registered for the AppDomain.

You can change the way it resolves specific assemblies using `<bindingRedirect>` tags in your App.config (or Web.config) file, giving it a different name to use instead if it tries to resolve a specific range of versions for an assembly.  This is useful if you want to support references to multiple versions of the same assembly (eg, from older plugins), but only want to use a single version at runtime.

However, these redirects must be specified statically in the config file, and cannot be changed at runtime.  If you don't control the config file (eg, if you're writing a plugin), or if you don't know what redirects you will want until runtime, this doesn't help.

Instead, you can handle the [`AppDomain.AssemblyResolve` event](https://msdn.microsoft.com/en-us/library/system.appdomain.assemblyresolve), which lets you run your own code to load an assembly if the loader fails to find it. 

This event is meant to be used if you put your assemblies somewhere where the loader can't find them (eg, as embedded resources in your EXE for a single-file application, in a subfolder, or even over HTTP).  However, you can also use this to catch loads of older versions of an assembly and load the newest version instead.

There are a few traps to beware of when writing AssemblyResolve handlers:

 - You must add your handler before the runtime tries to load the assembly.  In particular, note that the JITter will load all assemblies used by a method before the method starts executing, in order to properly JIT-compile the method itself.  
This means that you must add your AssemblyResolve handler before calling any method that uses types in the assembly in question.

 - Similarly, when you first reference a type, its static initializer will run, and the JITter will load any assemblies used by its static constructor (in addition to assemblies containing types in method signatures or fields).  
Therefore, you must also add your handler before loading any type that uses the assembly directly.

 - The assemly resolver will only raise this event if it fails to find the assembly on its own.  In particular, if you load an assembly that is in the GAC using its full name (including version and PublicKeyToken), the AssemblyResolve event will not be raised at all.  This limits the utility of this event for binding redirection.

 - If you call `Assembly.Load()` in your handler with a more-precise assembly name, make sure to prevent stack overflows if that assembly name isn't found either (the loader will raise the event again and re-enter your handler)

 - Once an assembly name fails to load, [the runtime will cache the binding failure](https://msdn.microsoft.com/en-us/library/aa98tba8) and never try to load that name again.  In particular, if an assembly fails to load before you attach your handler, it's too late for you to handle it next time.

I wrote code to handle `AssemblyResolve` and simulate a single binding redirect:

```csharp
///<summary>Adds an AssemblyResolve handler to redirect all attempts to load a specific assembly name to the specified version.</summary>
public static void RedirectAssembly(string shortName, Version targetVersion, string publicKeyToken) {
	ResolveEventHandler handler = null;

	handler = (sender, args) => {
		// Use latest strong name & version when trying to load SDK assemblies
		var requestedAssembly = new AssemblyName(args.Name);
		if (requestedAssembly.Name != shortName)
			return null;

		Debug.WriteLine("Redirecting assembly load of " + args.Name
					  + ",\tloaded by " + (args.RequestingAssembly == null ? "(unknown)" : args.RequestingAssembly.FullName));

		requestedAssembly.Version = targetVersion;
		requestedAssembly.SetPublicKeyToken(new AssemblyName("x, PublicKeyToken=" + publicKeyToken).GetPublicKeyToken());
		requestedAssembly.CultureInfo = CultureInfo.InvariantCulture;

		AppDomain.CurrentDomain.AssemblyResolve -= handler;

		return Assembly.Load(requestedAssembly);
	};
	AppDomain.CurrentDomain.AssemblyResolve += handler;
}
```
