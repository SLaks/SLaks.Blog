---
title: "About the new design"
layout: "post"
categories: [Jekyll, LESS, DRY]
---

My new design is powered by Jekyll and LESS (the LESS does as much or more as the Jekyll).

When implementing the design, I had the following goals in mind:

 - No costs
  - I use GitHub Pages for completely free hosting (other than the cost of the domain name)
  - This means that I cannot use Octopress or Jekyll plugins
 - No build step
  - I want to be able to edit posts from anywhere, without having to install Ruby or Grunt.js and run any kind of build process before pushing
  - I do use pre-compiled LESS, since Jekyll on GitHub Pages cannot compile LESS, and I really want to use LESS.  (also, since LESS needs to be edited far less often than post content, and since my editor [automatically compiles LESS files on save](http://vswebessentials.com/features/less)
 - No Javascript
  - Especially with the power of CSS selectors, there should be no reason to use Javascript for static content
  - If I add comments, I will have to relax this restriction (since the site will no longer be purely static content)
 - [DRY](http://en.wikipedia.org/wiki/Don%27t_repeat_yourself "Don't repeat yourself") implementation
  - Repetition of data or rules is a problem not only in large programs, but also in HTML templating engines or style definitions.  LESS in particular is very helpful in getting rid of unnecessary repetition in CSS.
 - Rich category support
  -  I feel that category listing pages are a great way to make posts more discoverable
 - Clean, minimalist, design
  - One of the mistakes of [my old design](http://old-blog.slaks.net) was that it put too little focus on content (both in size and in coloring). 
 - Easy navigation within series of multiple posts
  - _Coming soon_
  - For now, the new sidebar in post pages (see left side) provides this to a limited extent
 - Excessive use of bulleted lists
  - Bulleted lists are an excellent way to concisely present structured data

_Next time: [How I migrated from Blogger to Jekyll](/2013-05-31/migrating-from-blogger-to-jekyll/)_