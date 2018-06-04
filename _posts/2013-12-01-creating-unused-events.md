---
title: "Creating unused events in C#"
layout: "post"
categories: [C#, .Net, events]
---

Some interfaces have events that most implementations will never raise.  For example, the WPF `ICommand` interface has a `CanExecuteChanged` event that should be raised when the command becomes enabled or disabled.  Most commands are always enabled, so this event is no needed.  However, the interface still requires you to implement this event.  
Thus, most `ICommand` implementations will look something like this:

```csharp
class MyCommand : ICommand
{
	public bool CanExecute(object parameter) { return true; }
	public event EventHandler CanExecuteChanged;

	public void Execute(object parameter) {
		...
	}
}
```

This will generate a compiler warning, "The event 'MyCommand.CanExecuteChanged' is never used".  

To understand why events give a warning where unused methods don't, you must understand more about how event work.  [.Net events are actually an accessor pattern]({% post_url 2011-07-29-about-net-events %}), just like properties.  For example:

<div class="small"></div>
```csharp
public int MyProperty { get; set; }
public event EventHandler MyEvent;
```

The compiler transforms this code into something resembling

```csharp
private int MyProperty_BackingField;
public int get_MyProperty() { return MyProperty_BackingField; }
public void set_MyProperty(int value) { MyProperty_BackingField = value; }


private EventHandler MyEvent;
public void add_MyEvent(EventHandler value) {
	// Thread-safe version of MyEvent += value;
}
public void remove_MyEvent(EventHandler value) {
	// Thread-safe version of MyEvent -= value;
}
```

Just like the compiler generates a backing field when you create an auto-implemented property, the compiler also generates a backing field when you create a _field-like_ event.  Unlike properties, event accessors only allow you to add or remove handlers from the event.  To access the delegates currently in the event (eg, to call them and raise the event), you use the private backing field.  This is why you can't raise an event from outside the class that defines it &ndash; the backing field is `private`.  To be more precise, the name `MyEvent` resolves to the backing field when used inside the class, and refers to the event (the accessor pair) when used elsewhere.

It is this auto-generated field the compiler is warning you about.  Unlike an empty method (or a non-auto property with empty accessors), this backing field will needlessly waste memory for every instance of the class that you create.  Therefore, just like any other field, the compiler will give you a warning if you never use the field.

To solve this warning, you need to get rid of the field.  You can do that by explicitly defining event accessors that don't do anything:

```csharp
public event EventHandler MyEvent {
	add { }
	remove { }
}
```

Note that [you should not make a field-like event `virtual`](https://blogs.msdn.com/b/samng/archive/2007/11/26/virtual-events-in-c.aspx); the compiler does not handle overridden field-like events gracefully.