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