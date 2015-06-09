---
title: "Why are event accessors thread-safe, unlike auto properties?"
layout: "post"
categories: [C#, .Net, events]
---

The C# compiler will automatically implement public functions for you when writing [auto-implemented properties](http://msdn.microsoft.com/en-us/library/bb384054.aspx) and [field-like events]({% post_url 2013-12-01-creating-unused-events %}).  For example:

<div class="small"></div>
```csharp
public int MyProperty { get; set; }
public event EventHandler MyEvent;
```

The compiler transforms this code into something resembling

```csharp
private int MyProperty_BackingField;
public int get_MyProperty() { 
	return MyProperty_BackingField; 
}
public void set_MyProperty(int value) { 
	MyProperty_BackingField = value; }


private EventHandler MyEvent;
public void add_MyEvent(EventHandler value) {
	// Thread-safe version of MyEvent += value;
}
public void remove_MyEvent(EventHandler value) {
	// Thread-safe version of MyEvent -= value;
}
```

You may be wondering why auto properties compile to 