---
title: "Writing about Jekyll in Jekyll"
layout: "post"
categories: [Jekyll, Liquid, jekyll-hacks]
---

[Jekyll](http://jekyllrb.com) is a very nice system for writing blogs.  However, it does have some shortcomings, particularly in the Liquid templating engine.  In this post, I will talk about how to write about Liquid tags within a Liquid file (such as a Jekyll blog post).  The problem is that writing Liquid syntax such as tags or variables in the content will cause Liquid to interpret them as commands, and break evertything.

This problem can occur when writing a blog post about Liquid itself (such as this one), or when writing a blog post about code that generates Liquid markup (like I did [earlier]({% post_url 2013-06-02-migrating-syntax-highlighting-to-jekyll %})).

You may want to mention Liquid syntax in two ways: inline code (mentioning a <code>&#123;% tag %}</code> in a sentence), and multi-line syntax highlighted code blocks (including a whole chunk of Liquid markup in a post).

Liquid includes a tag specifically designed to solve this problem: the `{% raw %}{% raw %}{% endraw %}` tag.  For example, the Liquid Markdown used to produce the preceding sentence is:

<div class="jekyll small"></div>
{% assign openTag = '{%' %}
```
Liquid includes a tag specifically designed to solve this problem: 
the `{{ openTag }} raw %}{{ openTag }} raw %}{{ openTag }} endraw %}` tag.
```

I wrap the text I'm trying to produce (`{% raw %}{% raw %}{% endraw %}`) in <code>&#123;% raw %}...&#123;% endraw %}</code> tags to prevent liquid from treating the content itself as a tag.  Since Liquid processes the text before the Markdown parser sees it, the resulting Markdown source is simply <code>&#96;&#123;% raw %}&#96;</code>, which is exactly what I want.

All that overhead is very annoying when writing a simple tag.  We can make it simpler by writing part of the tag as an HTML entity, so that Liquid doesn't recognize it as a tag: `&#123;% tag %}`.  The browser will display the HTML entity as a regular `{`, but Liquid won't recognize it.  However, this does mean that we can't use Markdown <code>&#96;</code> blocks to create the code block, since that will escape the HTML and make it display a literal `&#123;`.  
Thus, the final approach is `<code>&#123;% tag %}</code>`.  Although this isn't much shorter than the Liquid raw tag, I find it more readable, since it doesn't nest Liquid content within Liquid commands.

[_Next time: How can you do this inside a syntax-highlighted code block?_]({% post_url 2013-06-10-jekyll-endraw-in-code %})