---
title: "Getting Started with the Visual Studio Theming Architecture"
layout: "post"
categories: [visual-studio, vs-extensions, C#]
---

Visual Studio 2010 rewrote the entire shell UI &ndash; the MDI tabs & tool windows, the toolbars, and the menus &ndash; in WPF.  This let it use WPF's powerful resources / theming system to style all of the UI elements, which Microsoft took advantage of in VS 2012 to add multiple themes (Light, Dark, and, later, Blue).  This blog post will explore how this system is implemented.  Later blog posts will explain how to use VS theme colors & controls in your own VS extensions, and, later, how to use VS theming directly in your own standalone application (which will require an installed copy of VS to run).

The theming system is built on WPF ResourceDictionaries, which contain reusable global resources such as colors, brushes, and control styles, keyed by strings or objects.  Visual Studio 2010 had a table of 463 theme colors in the `Microsoft.VisualStudio.Shell.VsColors` class (and `VsBrushes` that return brushes instead of colors), containing every color that used by VS2010's new UI theme.  Visual Studio 2012 then greatly expanded the theming system, theming the window chrome and introducing multiple color themes.  To power this, it replaced this table of theme colors with `Microsoft.VisualStudio.Shell.ThemeResourceKey`, which contains a category and an entry name, and indicates whether it's specifying the foreground or background color for that entry, and whether it refers to a color or a brush.  For compatibility, the older VsColors & VsBrushes still exist in later versions of VS as well, bound to the same colors as the corresponding ThemeResourceKeys in `EnvironmentColors`.

ThemeResourceKeys are broken down by category and contained by a number of classes (mostly) in `Microsoft.VisualStudio.PlatformUI`, including `EnvironmentColors`, `CommonControlsColors`, `BackstageColors`, `TreeViewColors`, `StartPageColors`, and more (some of these were introduced in VS2013 or Dev14).  For a complete list, open `Microsoft.VisualStudio.Shell.XX.0` and `Microsoft.VisualStudio.Shell.UI.Internal` (beware that this is unversioned, so it's trickier to use in cross-version extensions) in your favorite decompiler, then search for usages of `ThemeResourceKey` (which can be found in `Microsoft.VisualStudio.Shell.Immutable.11.0`).  Note that ThemeResourceKeys are compared by value, so you can use keys from later VS versions without referencing their DLLs by copying the key declaration into your own code.  Obviously, such keys will not have any colors in earlier VS versions, but this lets you use them without causing compilation issues (as long as you check the runtime VS version before using them).  Note also that any keys declared in unversioned DLLs are not guaranteed to exist in future VS versions either.

These keys (both the strings from VsColors & VsBrushes and the ThemeResourceKeys from later versions) are added to a global `ResourceDictionary` in `System.Windows.Application.Current` by the internal `ResourceSynchronizer` class when VS is launched, allowing them to be referenced in any WPF control anywhere in Visual Studio (in VS2012 and later, the same class will also repopulate this ResourceDictionary whenever you change the current theme).  This lets you easily use theme colors in your own extensions.

To use theme colors in your own VS extension, you simply need to add a reference to `Microsoft.VisualStudio.Shell.XX.0` (from the minimum VS version that you want to support) and declare it in your XAML.  You can then use `{DynamicResource}`s with `{x:Static}` declarations to use the keys, and they will pick up the correct theme colors at runtime.  For example: 

<div class="xaml"></div>
```xml
<Control x:class="YourAddin.YourControl"
		 xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
		 xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
		 xmlns:shell="clr-namespace:Microsoft.VisualStudio.Shell;assembly=Microsoft.VisualStudio.Shell.10.0">
	<Border x:Name="NotificationWindow" Loaded="NotificationWindow_Loaded"
			Background="{DynamicResource {x:Static shell:VsBrushes.CommandBarOptionsBackgroundKey}}"
			TextElement.Foreground="{DynamicResource {x:Static shell:VsBrushes.CommandBarTextActiveKey}}"
			BorderBrush="{DynamicResource {x:Static shell:VsBrushes.DropDownBorderKey}}"
			BorderThickness="1">
		...
	</Border>
</Control>
```

If you aren't targetting VS2010, you can also use other resources such as `CommonControlsColors` inside the  `Microsoft.VisualStudio.PlatformUI` namespace.  If you need colors rather than brushes (for example, if you're constructing a gradient), use `VsColors` instead of `VsBrushes`. 

Although this will work correctly at runtime within Visual Studio, you won't see any colors in the XAML designer, since it doesn't load any VS themes.  In part three of this series, I'll explain how to load a VS theme into the XAML designer yourself, so you can make sure your colors match without having to build & run your extension after every change.

_Next time: Escaping the Box: Using VS themes outside Visual Studio_