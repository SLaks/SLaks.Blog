---
title: "Migrating from Blogger to Jekyll"
layout: "post"
categories: [Jekyll, blogger, Node.js]
---

The first step in my migration to Jekyll was to import my old posts into the Jekyll site.  To do this, I used [blogger2jekyll](https://github.com/coolaj86/blogger2jekyll), a wonderful open-source Node.js script that does exactly that.

Using this tool is very simple.  First, log into Blogger's admin panel, got to Settings, Other, and click Export blog to download a giant XML file with all of your posts.

Next, install and run the script: (you'll need to install [Node.js](http://nodejs.org) first)

```bash
npm install -g blogger2jekyll
blogger2jekyll  /path/to/blog-dd-mm-yyyy.xml ./_posts
```

If you aren't running it from the directory containing your Jekyll site, you'll need to specify the full path to Jekyll's `_posts` directory. 
 
This script will create HTML files with the contents of each post from the exported blog, ready for Jekyll to serve.  It will include `layout: "post"` in the Jekyll [front matter](http://jekyllrb.com/docs/frontmatter/); if you have a different layout name, you'll need to do a bulk replace within the resulting files.  It will also set the `permalink` for each post so that existing posts keep their old URLs (even if the Jekyll blog hasa different URL scheme).

I had a couple of problems with this script:

 - When running on Windows, the generated permalink URLs use backslashes rather than forward slashes

 - Posts that contain Liquid-like markup will break Jekyll with a parse error

 - The script also imports comments directly into the resulting HTML, which is rarely a good idea.

I fixed all of these issues in a [pull request](https://github.com/coolaj86/blogger2jekyll/pull/7).  Until that pull request is accepted, you can pick up these fixes by running `npm install -g git://github.com/SLaks/blogger2jekyll.git`.

I changed it to wrap the contents of each post in a Liquid <code>&#123;% raw %}</code> tag.  I also added an internal option to skip comments.  However, I didn't add a command-line interface for the comment option; to use it, you'll need to manually add `, skipComments: true` to the [`parse()` call](https://github.com/SLaks/blogger2jekyll/blob/master/bin/blogger2jekyll.js#L46).

_Next time: Converting Code Blocks_