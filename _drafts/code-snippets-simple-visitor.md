---
title: "Code Snippets: Simple Visitor Pattern"
layout: "post"
categories: [C#, design-patterns, code-snippets]
---

```csharp
public static void Visit(this Login login, Action<TwitterLogin> twitter, Action<FacebookLogin> facebook, Action<PasswordLogin> email) {
	if (login == null) throw new ArgumentNullException("login");

	bool found = Call(twitter, login)
				|| Call(facebook, login)
				|| Call(email, login);
	if (!found)
		throw new ArgumentException("Unhandled login type " + login.GetType(), "login");
}
static bool Call<T>(Action<T> method, object obj) where T : class {
	var co = obj as T;
	if (co == null)
		return false;
	if (method != null)
		method(co);
	return true;
}
static bool Call<T, U>(Func<T, U> method, object obj, out U retVal) where T : class {
	retVal = default(U);
	var co = obj as T;
	if (co == null)
		return false;
	if (method != null)
		retVal = method(co);
	return true;
}
```

```csharp
bool TryCast<T>

return TryCast<A>(x)
	|| TryCast<B>(x)
	|| TryCast<C>(x);
```

_Side note:_ 