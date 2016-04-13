---
title: "Extending Visual Studio 2013, Part 2: Core Concepts"
layout: "post"
categories: [visual-studio-2013, vs-extensions]
---

[My previous post]({% post_url 2013-10-18-extending-visual-studio-part-1-getting-started %}) described how to get started writing Visual Studio extensions.  This post will introduce the basic concepts needed to work with Visual Studio's extensibility APIs.

# Creating an extension

The Visual Studio SDK includes a number of templates for creating extensions.  Which template you use depends on what parts of Visual Studio you want to extend.

## Editor Extensions
If you only want to extend the new WPF editor, you can create an editor extension.  Editor extensions allow you to add or change features (IntelliSense, highlighting, etc) for existing languages that use the new editor, as well as creating entirely new language service with their own syntax highlighting & IntelliSense.  These projects simply export MEF components to be consumed by the editor, without involving any COM interop at all.  

The SDK includes four different templates for editor extensions; these templates include sample code for specific editor features:

 - The Editor Classifier template contains a simple synax highlighting service for text files.  You will need to write a parser to figure out which spans to highlight
 - The Editor Margin template creates a WPF control which will be displayed below the text editor.  You can easily change where the margin will appear; you will need to write a useful UI to display in the margin.
 - The Editor Text Adornment template adds WPF visuals within the text, relative to individual characters.  You will need to write code to determine where to place visuals, and design visuals & interactivity to display.
 - Finally, the Editor Viewport Adornment template adds UI to the text editor itself.  You will need to figure out what UI to display, and what z-index it should get among the [text editor's existing layers](http://msdn.microsoft.com/en-us/library/microsoft.visualstudio.text.editor.predefinedadornmentlayers).

Each of these templates includes a MEF export of the appropriate editor service (eg, `IClassifierProvider`, `IWpfTextViewMarginProvider`, or `IVsTextViewCreationListener`) for the editor to import and invoke.  Extensions can export as many components as you want; you can freely mix and match exports from different templates in your project.  If you want to extend a different part of the editor (eg, IntelliSense, outlining, or error checking), you can start from any of these templates, then delete the existing classes and start fresh.

## VsPackage extensions
If you want to extend other aspects of Visual Studio, you'll need to dig into the older COM code and create a VsPackage project.  VsPackages can extend all other parts of Visual Studio, including tool windows, options pages, project system, and menu/toolbar commands.  They can also add event handlers to other parts of Visual Studio to further customize behavior.

VsPackage extensions are created from the VsPackage project template, which will open a wizard allowing you to add sample functionality to your package.  You can create a sample menu command, a custom tool window, or a fully custom editor (hosting your own WinForms control such as a designer rather than the built-in WPF text editor), then edit the samples to include your actual functionality.


## More advanced extensions
Visual Studio extensions are packaged in VSIX files, which are ZIP files containing DLLs and other files used by the extension.  When you install an extension, the VSIX installer will extract the VSIX to a folder for the extension, in `<user profile>\AppData\Local\Microsoft\VisualStudio\12.0\Extensions\<random characters>`.  If your extension needs other files (eg, a separate EXE file), you can add the files to your project, then set `Include in VSIX` to true in the Properties window.  You can get the installation directory in your code from `Path.GetDirectoryName(typeof(YourType).Assembly.Location)`.

The VSIX file also controls how your DLL is loaded by Visual Studio; this is specified by the Assets section [`Source.extension.vsixmanifest` file](http://msdn.microsoft.com/en-us/library/vstudio/ee943167.aspx) in the extension project.  To load a VsPackage from your project, register it as a `Microsoft.VisualStudio.VsPackage` asset; to load MEF exports, use `Microsoft.VisualStudio.MefComponent` (the project templates do this for you).  If you want to use both approaches in the same extension, you'll need to register the project twice; once as each asset type.

# Working with VsPackages

VsPackage extensions must contain a class that implements [`IVsPackage`](http://msdn.microsoft.com/en-us/library/microsoft.visualstudio.shell.interop.ivspackage), which Visual Studio will call to intialize the extension.  Most managed extensions will instead inherit the [`Package` helper class](http://msdn.microsoft.com/en-us/library/microsoft.visualstudio.shell.package), which implements most of this and other basic interfaces for you, leaving you free to write actual extensions.  For more information, see [MSDN](http://msdn.microsoft.com/en-us/library/vstudio/bb166209.aspx "Managed VSPackages").

In your package class, you can apply `[Provide*]` attributes to provide options pages, tool windows, project items, and other services.  See [here](http://msdn.microsoft.com/en-us/library/Microsoft.VisualStudio.Shell%28v=vs.110%29.aspx#typeList) (scroll down to `Provide`) for all available attributes.  You can also override the `Initialize()` method to add menu commands (using the `IMenuCommandService` service) and register event handlers.

The COM portions of Visual Studio are linked together using service providers.  To get an instance of a VS-provided COM interface, you need to call `GetService()` on a `ServiceProvider` object and pass it the GUID for the service you need, from the GUID for the matching `SVs*` interface.  It will return a COM object implementing the appropriate `IVs*` interface.  

Your `IVsPackage` will get an `IServiceProvider` in its `SetSite()` method, which Visual Studio will call as the extension is initialized.  The `Package` wrapper class implements this for you and saves a reference to the service provider, exposing a `GetService()` method for you to call:

<div class="small"></div>
```csharp
var textManager = (IVsTextManager)this.GetService(typeof(SVsTextManager));
```

The COM interop classes for the various services you can use are contained in assemblies with names ending in `.Interop`; MSDN has a [full list](http://msdn.microsoft.com/en-us/library/vstudio/bb164686.aspx).

If you need to interact with newer MEF components from a VsPackage, you need to grab Visual Studio's global composition service from from the ServiceProvider:

<div class="small"></div>
```csharp
var componentModel = (IComponentModel)this.GetService(typeof(SComponentModel));
```

# Working with MEF extensions
Using MEF is much simpler.  You can export components used by the editor by implementing the appropriate editor interface, then decorating your class with the MEF `[Exports]` attribute.  In these classes, you can import other editor services by decorating a field with the `[Imports]` attribute.

The new editor is built around ContentTypes, which map editor services to file types.  Each editor language (C#, HTML, CSS, etc) has a `ContentType` containing the name of the language, as well as a list of base ContentTypes that it inherits.  ContentType inheritance allows you to reuse editor service in more advanced languages; for example, the `Razor` ContentType inherits from the `htmlx` ContentType  (HTMLX is the [new HTML editor](http://madskristensen.net/post/my-road-to-visual-studio-2013) that shipped in VS2013; the old HTML editor is not easily extensible).  You can create your own ContentTypes by applying attributes to MEF-exported static fields; see the documentation for [details](http://msdn.microsoft.com/en-us/library/dd885244.aspx#sectionToggle0) and a [walkthrough](http://msdn.microsoft.com/en-us/library/ee372313.aspx).

Typically, you will only want to export services for certain ContentTypes, or for documents with certain roles (eg, read-only editors, editors that are backed by an actual file, as opposed to the output window, etc).  You can control this by applying filtering attributes like `[ContentType]` or `[TextViewRole]` to your exported class; most editor components will filter by these attributes when importing.

For example:

```csharp
[Export(typeof(IVsTextViewCreationListener))]
[ContentType("htmlx")]
class MyHtmlTextViewCreationListener : IVsTextViewCreationListener {
    [Import]
    public IVsEditorAdaptersFactoryService EditorAdaptersFactoryService { get; set; }

    [Import]
    public IClassifierAggregatorService Classifiers { get; set; }

    [Import]
    public ICompletionBroker CompletionBroker { get; set; }

    [Import]
    public IQuickInfoBroker QuickInfoBroker { get; set; }

    [Import]
    public SVsServiceProvider ServiceProvider { get; set; }

    public void VsTextViewCreated(IVsTextView textViewAdapter) {
        // ...
    }
}
```

For a full list of importable service, see [MSDN](http://msdn.microsoft.com/en-us/library/dd885243.aspx "Editor Imports").  Note that this list only includes services from the editor itself; other parts of Visual Studio, such as the web tooling, export their own services that are not documented anywhere.  To find these, use a decompiler.

If you need to use a COM-based service, you can get a ServiceProvider by `[Import]`ing an instance of the [`SVsServiceProvider` interface](http://msdn.microsoft.com/en-us/library/microsoft.visualstudio.shell.svsserviceprovider.aspx), as shown in the code above.

Exportable editor services generally fall into two categories: listeners and providers.  Listeners are used to handle events from the editor system.  For example, you can export an `IVsTextViewCreationListener` and the editor will call your function whenever a text view is created.  Similarly, `IWpfTextViewConnectionListener` will notify you when a TextBuffer is created for your ContentType, including new buffers in existing views  (for [projection buffers](http://msdn.microsoft.com/en-us/library/dd885240.aspx#projection)).  Other VS components, such as the web tooling, have their own listeners.

Providers allow the editor to create instances of your services when creating text views of buffers.  Since all MEF-managed parts are essentially singletons and cannot have multiple instances, the editor will import a single instance of an <code>I<i>Whatever</i>Provider</code>.  This provider will expose a `Create()` method that takes a text buffer and returns an  <code>I<i>Whatever</i></code> for that document, allowing the editor to create as many instances as it needs.

For more information on the various services you can provide for the editor, see [MSDN](http://msdn.microsoft.com/en-us/library/dd885244.aspx "Editor Extension Points").

[_Next time: How Visual Studio deals with assembly versioning_]({% post_url 2014-02-21-extending-visual-studio-part-3-assembly-versioning %})