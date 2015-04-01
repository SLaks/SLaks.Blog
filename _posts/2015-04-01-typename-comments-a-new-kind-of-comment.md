---
title: "Introducing Typename Comments – A New Kind of Comment"
layout: "post"
categories: [april-fools, C#]
---

C# has two well-known styles of comments: C-style comments (`/* ... */`) and C++-style comments (`// ...`).   This blog post introduces a third kind of comment: typename comments.  With a bit of supporting code, you can write comments as part of type names &ndash; in casts, variable declarations, generic parameters, and anywhere else a typename can occur.

Typename comments are type expressions that precede any type that you define, like this:

```csharp
partial class Scope {
	interface IPlayer {
		void PlayAgainst(M.u.s.t.B.e.A.n.N.P.C.IPlayer other);
		List<IPlayer> FindDefeatedOpponents();
	}

	class Player : IPlayer {
		W.i.l.l.B.e.R.e.s.e.t.A.t.E.a.c.h.L.e.v.e.l.Player opponent = null;
		readonly List<A.d.d.e.d.A.f.t.e.r.L.e.v.e.l.E.n.d.Player> pastOpponents = new List<Player>();
		bool defeated;

		public List<IPlayer> FindDefeatedOpponents() {
			return pastOpponents
				.Where(p => p.defeated)
				.ToList<C.l.a.s.s.e.s.C.a.n.n.o.t.B.e.C.o.v.a.r.i.a.n.t.IPlayer>();
		}

		public void PlayAgainst(IPlayer other) {
			opponent = (T.h.i.s.I.s.T.h.e.O.n.l.y.D.e.r.i.v.e.d.C.l.a.s.s.Player)other;
		}
	} 
}
```

You may have noticed the partial `Scope` class that contains all of this code.  Unlike other comments, typename comments need this bit of supporting code.  You can only use typename comments if both the type being referenced and the code containing the comment are wrapped in the same `Scope` class.  In addition, you also need to add the following supporting code once in your project:

```csharp
partial class Scope {
	class A : Scope { } class B : Scope { } class C : Scope { } class D : Scope { }
	class E : Scope { } class F : Scope { } class G : Scope { } class H : Scope { }
	class I : Scope { } class J : Scope { } class K : Scope { } class L : Scope { }
	class M : Scope { } class N : Scope { } class O : Scope { } class P : Scope { }
	class Q : Scope { } class R : Scope { } class S : Scope { } class T : Scope { }
	class U : Scope { } class V : Scope { } class W : Scope { } class X : Scope { }
	class Y : Scope { } class Z : Scope { }

	class a : Scope { } class b : Scope { } class c : Scope { } class d : Scope { }
	class e : Scope { } class f : Scope { } class g : Scope { } class h : Scope { }
	class i : Scope { } class j : Scope { } class k : Scope { } class l : Scope { }
	class m : Scope { } class n : Scope { } class o : Scope { } class p : Scope { }
	class q : Scope { } class r : Scope { } class s : Scope { } class t : Scope { }
	class u : Scope { } class v : Scope { } class w : Scope { } class x : Scope { }
	class y : Scope { } class z : Scope { }
}
```

Although these supporting classes are compiled into your code, the comments themselves, like any other comment, will be stripped by the compiler.

The best part of typename comments is their broad support spectrum: This syntax feature has been supported since the very first versions of both C# and VB.Net, over 13 years ago.  However, the Visual Studio IDE only added syntax highlighting for typename comments with Roslyn in VS2015.  Although it took them long enough to address this critical issue, you can now enjoy typename comments in their full glory:

[<img src="/images/2015/vs-typename-comments.png" alt="Screenshot of syntax highlighting for typename comments" style="max-width:100%;" />](/images/2015/vs-typename-comments.png)

_Next time: The method behind the madness_