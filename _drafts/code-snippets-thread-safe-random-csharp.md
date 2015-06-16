---
title: "Code Snippets: Thread-safe random number generation in C#"
layout: "post"
categories: [C#, thread-safety, code-snippets]
---

_This post is part of a [series](/#code-snippets) of blog posts called code snippets.  These blog posts will explore successively more interesting ways to do simple tasks or abuse language features._

The `Random` class provides an easy, convenient way to generate random numbers.  However, generating random numbers in a multi-threaded environment is not so simple.