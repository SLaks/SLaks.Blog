---
title: "Typename Comments, part 2: The method behind the madness"
layout: "post"
categories: [C#]
---
[Last time](/2015-04-01/typename-comments-a-new-kind-of-comment), I introduced a new syntax for code comments, typename comments.  April Fools!  However, although I do not intend for anyone to actually write code like this, everything I wrote in that blog post is true; this syntax does work.

The reason this technique works is that the letter classes are both contained in and derived from the outer `Scope` class.  Because they're contained in the `Scope` class, they are referenced as static members of that class &ndash; `Scope.A`.  However, like any other static member, they can also be accessed through a qualifier of any class that derives from `Scope`.  Since they themselves derive from `Scope`, they can be chained, writing `Scope.A.B.C`, etc.  This is how we construct typenames that can be arbitrarily long

Nesting all of the actual classes in the project within the `Scope` class lets them be referenced in the same fashion.  This is why you can write `Scope.A.B.C.SomeRealClass`.  Since the actual classes don't also inherit `Scope`, you cannot chain them further, but there is no need for that.

Finally, again since all of the actual classes are nested within `Scope`, you don't need to qualify the typenames with `Scope.` &ndash; like any other static members, they can be accessed without a qualifier anywhere inside the declaring class.

This is why you can only use typename comments for types declared within your project (so they can be nested within `Scope`).  Any other type cannot be referenced at the end of the chain, since it isn't nested within the class at the tip.

Like other static members, the qualifier used to reference the member is purely syntactic sugar.  Whether you write `Scope.MyClass` or `Scope.S.o.m.e.L.o.n.g.C.o.m.m.e.n.t.MyClass`, you're actually just referencing `Scope.MyClass` (albeit in a convoluted way), so the comment is not visible in compiled code.

The syntax highlighting is actually a side-effect of an unrelated feature new to Roslyn.  Roslyn will detect unnecessary qualifications &ndash; extra namespaces, using type names instead of keywords, or incorrect or unnecessary qualifiers for static members &ndash; and render them in a faded color, and also offer a quick fix to remove them.  This entire technique is about adding unnecessary qualifiers to typenames, so Roslyn fades all of the qualifiers to tell you to remove them.