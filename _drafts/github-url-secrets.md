---
title: "GitHub URL Secrets"
layout: "post"
categories: [GitHub]
---

GitHub is one of the most amazing success stories I've seen in developer tooling.  Just six years after launching,  it is the _de facto_ standard for open-source hosting, including the entire Node.js ecosystem, the Ruby language, and many more.  Even GitHub's competitors &ndash; Microsoft (CodePlex) and Google (Google Code) &ndash; now have active GitHub accounts (including the next version of ASP.Net).  The primary reasons for this success are that GitHub is a beautiful, yet simple, tool, and that it is clearly built by geeks, for geeks.

One of the many subtle features that make GitHub such a joy to use is its extremely flexible URLs.  Every part of the URL to a commit, directory, or source file on GitHub has a clear meaning, and you can change any part to make a URL that will give you something else.

The full URL structure looks like this:

> https://&zwj;github.com/**user**/**repo**/**view**/**revision**/**path**

 - **user** and **repo** are, uunsurprisingly, the GitHub username and repository name to show.  You can change the username in a URL you have open to easily jump to that same URL in a different fork (or upstream) of a repo.
 - **view** specifies how GitHub should display the resource.  The following views are available:
  - `blob` will show the contents of a file within the GitHub UI.  This is only available for paths that refer to files, not directories.
  - `raw` will serve the raw contents of a file directly (useful for downloading).  This too only works for files.
  - `blame` will show a web-based version of `git blame`, showing which commit last modified each line.  This is a nice way to get a deeper history of a file.  This too is not available for folders.
  - `tree` will show the contents of a directory (this is the default view when you open a repo)
  - `history` will show a list of commits that affected the file or folder (or the commit history of the entire repo, if no path is specified).  This is the only view which works for both files and folders.
  - `commit` will show the details (including the description and all of the changes) of the specified commit.  This view ignores the path entirely.
 - **revision** specifies the version of the repository to look at, allowing you to browse folders, files, or history as of a specific point in the repo's history.  This can be any valid git revision reference, including branch names, tag names, and commit IDs.  It also has a number of more interesting and powerful options, which I'll explore below.
 - **path** is the path to the file or folder to display.  This is optional, and will default to the repo root.

There are also a couple of specialised URLs that do not follow this pattern:

 - [File finder](https://github.com/blog/793-introducing-the-file-finder) (https://&zwj;github.com/**user**/**repo**/find/**revision**, or press `t` anywhere in a source or directory page)  
   This lets you jump to any file in the repo by tpying part of its name.  It's a great way to quickly jump around a large repo from the keyboard, assuming you know where you're going.
 - [Compare](https://github.com/blog/612-introducing-github-compare-view) (https://&zwj;github.com/**user**/**repo**/compare/**start-revision**...**end-revision**)


## Other URLs
 - You can add `?w=1` to any diff URL (commit, pull request, or compare) to see a diff that ignores whitespace
 - You can add `.diff` or `.patch` to any diff URL to see a plaintext patch file for that comparison.
 - You can add `?author=<username>` to a commit listing URL to filter it to only show commits by that author.	
 - You can add `#L42-L95` to any source file URL to highlight a single line or a range of lines.  (you can also do this in the UI by clicking and shift-clicking line-numbers)