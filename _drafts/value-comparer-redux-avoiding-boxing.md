---
title: "ValueComparer, Redux: Avoiding Boxing"
layout: "post"
categories: [C#, .Net, boxing, comparison, value-types]
---

A couple of years ago, I posted about a [`ValueComparer` class]({% post_url 2010-12-29-simplifying-value-comparison-semantics %}) to help implement `Equals()`, `GetHashCode()`, and `CompareTo()`.

However, this class will box any primitive properties used (since it accepts `Func<T, object>`s), resulting in a slight performance hit.
http://stackoverflow.com/a/18066753/34397
GitHub project? NuGet?