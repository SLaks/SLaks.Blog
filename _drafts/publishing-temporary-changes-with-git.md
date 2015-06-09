---
title: "Publishing Temporary Changes with git"
layout: "post"
categories: [git]
---

When working on shared projects, it is ocasionally useful to publish a specific unfinished version of your code.  For example, if you come across a bug in your editor (or an extension) when working on an open source project, you can quickly publish the exact source that reproduced the bug, without affecting your actual commit history:

```sh
git commit -am "Reproduce Bug"
git push origin HEAD:temp-some-bug
git reset HEAD^
```