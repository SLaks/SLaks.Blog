---
title: "Code Snippets: Variadic Generics in C#"
layout: "post"
categories: [C#, generics, code-snippets]
---

_This post is part of a [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

C++ introduced [Variadic Templates](https://en.wikipedia.org/wiki/Variadic_template) &ndash; template classes or functions that can take an arbitrary number of template parameters (like varargs/paramarray function parameters).  This feature has a number of uses.  It's the simplest way arbitrary tuple or function types.  It's also useful when making a function that can take an arbitrary number of objects or delegates.

C# does not support this feature.  For variadic types, there is no direct workaround; this is why the BCL has 16 overloads of the generic `Func` and `Action` delegates, and 8 overloads of `Tuple`, to cover all common uses.

However, when designing something that needs to take an arbitrary number of objects of different generic parameters, there are workarounds.

This simplest workaround is to use repeated method calls.  You can make a generic function that returns `this`, and call it separately for each parameter with inferred type parameters.  For example:

```csharp
class Container1 {
    public Container1 WithStuff<T>(Func<T> func) {
        // Do interesting things...
        return this;
    }
}

new Container1()
    .WithStuff(() => new List<byte>())
    .WithStuff(() => new MemoryStream())
    .WithStuff(() => new CredentialCache());
```

The disadvantage of this approach is that the repeated method calls don't look nice, especially if you're just trying to accept a number of parameters for a single thing.

A more interesting approach is to abuse [collection initializers](https://msdn.microsoft.com/en-us/library/bb384062).  Collection initializers let you write a list of expressions (or argument lists) in braces (just like an array initializer), and compile them into a series of `Add()` calls.  The nice part of this feature is that each item compiles to its own `Add()` call (with its own generic parameters and type inference), giving you a way to hide the repeated calls from the syntax.

The previous example can thus be adapted to look like this:

```csharp
class Container2 : System.Collections.IEnumerable {
    public void Add<T>(Func<T> func) {
        // Do interesting things...
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() {
        throw new NotSupportedException();
    }
}

new Container2() {
    () => new List<byte>(),
    () => new MemoryStream(),
    () => new CredentialCache()
};
```

The class must implement the non-generic `IEnumerable` interface in order to allow collection initializers (since the feature is meant, as its name implies, to work with collections).

Unlike normal method calls, collection initializers don't expose any way to explicitly specify generic type parameters; they can only be called using type inference.  For methods that accept instances of `T` (or lambdas that return such instances), this is not a problem; the compiler can infer the type parameter from the compile-time type of the expression used.  If your method only uses the generic type parameter as the parameter type of a lambda, you must instead explicitly specify the parameter type in the lambda (eg, `(string x) => blah`), telling the compiler what `T` is.

Note that this only works at construction time (syntactically, this is an optional part of the `new` keyword).  If you're trying to make a variadic method on an existing instance (or a static method), you can make a new class to serve as the method's parameter, and put the collection initializer in that class.  For example:

```csharp
class ValidationManager {
    readonly List<Tuple<object, string>> errors;

    public void ValidateItems(ItemValidators parameter) {
        errors.AddRange(parameter.Errors);
    }
}

class ItemValidators : System.Collections.IEnumerable {
    readonly List<Tuple<object, string>> errors;
    public IReadOnlyCollection<Tuple<object, string>> Errors => errors.AsReadOnly();
    public void Add<T>(string error, T instance, Func<T, bool> rule) {
        if (!rule(instance))
            errors.Add(Tuple.Create((object)instance, error);
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() {
        throw new NotSupportedException();
    }
}

var validation = new ValidationManager();

validation.ValidateItems(new ItemValidators {
    { "Stream cannot be empty", new MemoryStream(), s => s.Length == 0 },
    { "Email address must have a display name", new MailAddress(), m => string.IsNullOrWhiteSpace(m.DisplayName) }
});
```

As you may have noticed from this example, these workarounds don't help you _store_ variadically-typed items.  What you do with the parameters you receive depends on what you're ultimately trying to accomplish.  If you're dealing with reflection (but want strongly typed lambdas), you can simply store `typeof(T)`.  If you just need instances (like the above example), you can cast the items to `object`.  However, the most powerful way to deal with this is to collect non-generic delegates that close over the generic parameter (creating a generic closure class).  As long as you're able to do useful things from a non-generic entry-point (eg, cast an object to `T`), you can retain the generic parameter from within the delegate.  For example:


```csharp
class ItemReporter : System.Collections.IEnumerable {
    readonly Dictionary<Type, Func<object, string>> reporters
        = new Dictionary<Type, Func<object, string>>();


    public void Add<T>(Func<T, string> reporter) {
        reporters.Add(typeof(T), obj => typeof(T) + "\t" + reporter((T)obj));
    }

    public string Report(params object[] items) {
        return string.Join(Environment.NewLine,
            items.Select(obj => reporters[obj.GetType()](obj))
        );
    }


    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() {
        throw new NotSupportedException();
    }
}

var reporter = new ItemReporter {
    (FileStream fs) => fs.Name + "; " + fs.Length + " bytes",
    (DateTime d) => d.ToString("U"),
    (DirectoryInfo d) => d.Name + ": " + d.EnumerateFiles().Count() + " files"};
Console.WriteLine(reporter.Report(
    DateTime.Now,
    DateTime.UtcNow, 
    new DirectoryInfo(Environment.CurrentDirectory)
));
```

As mentioned above, you must explicitly specify the lambda parameters to allow the compiler to infer `T` for each generated `Add()` call.

This demonstrates one more limitation of this workaround: It is impossible to store type information.  If you implement this class in C++, you'd be able to enforce &ndash; at compile time &ndash; that the arguments passed to `Report()` match the types of the reporters passed to the constructor (since those types would be encoded in the template parameters of the instance's compile-time type).  In C#, however, the only way to implement `Report()` is to accept an array of `object`, which obviously has no type safety.

Note that this approach does not work for base classes or interfaces; if the reporter doesn't have a delegate for an object's exact runtime type, the dictionary lookup will fail.  It is impossible to allow that with a dictionary (since assignment compatibility is not an equivalence relation).  If you want to support that, you could either loop through every reporter until you find one with a compatible type (which would be O(n) in the number of reporters, but would be simpler code), or recursively loop through the base classes and interfaces of `obj.GetType()` until you find a type in the dictionary (which would be O(n) in the depth of the type hierarchy).

This technique is particularly useful for visitor patterns (example [usage](https://github.com/madskristensen/WebEssentials2013/blob/9316c9f373d4d764148f01e1402a2bf7a2e4ffda/EditorExtensions/CSS/Adornments/ColorTagger.cs#L53-L62) and [implementation](https://github.com/madskristensen/WebEssentials2013/blob/9316c9f373d4d764148f01e1402a2bf7a2e4ffda/EditorExtensions/Shared/Helpers/Css/CssItemAggregator.cs)); more details coming soon in a separate blog post.