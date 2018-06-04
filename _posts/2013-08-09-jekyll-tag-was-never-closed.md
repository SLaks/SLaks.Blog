---
title: "Jekyll bug: Tag was never closed"
layout: "post"
categories: [Jekyll, Liquid, bugs]
---

{% assign openTag = '{%' %}

After upgrading to Jekyll 1.1, you may notice that posts that used to work fine now give an error like `tag was never closed`.  These errors can appear for no apparent reason; the tags will appear to be correctly closed.

This error occurs if the first blank line in the post is inside a Jekyll block (eg, `{{ openTag }} raw %}` or `{{ openTag }} highlight %}`). 

The bug is caused by a change in Jekyll's post excerpt support.

As of version 1.0, Jekyll creates an [excerpt](https://github.com/mojombo/jekyll/issues/837) for every post in your site, containing the first paragraph of text in that post (this allows post listings to display snippets of content).  By default, the excerpt contains all text until the first blank line (double-newline); this separator can be changed by setting `excerpt_separator` in `_config.yml`.

The problem came in Jekyll 1.1.0, which [parses Jekyll tags in post excerpts](https://github.com/mojombo/jekyll/pull/1302).  Now, after extracting the first paragraph of text, the excerpt is parsed as Liquid markup so that tags in the excerpt work correctly.  However, if you wrote posts without specifically designing them for excerpts, the excerpt can end in the middle of a Liquid tag, resulting in this error.

Here is an example of the bug:


```liquid
{% raw %}---
title: "Buggy post"
---
This is an example of a post with some code:
{% highlight html %}
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title></title></head>

<body></body>
</html>
{% endhighlight %}
{% endraw %}
```

Jekyll will extract the following excerpt:

```liquid
{% raw %}This is an example of a post with some code:
{% highlight html %}
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title></title></head>
{% endraw %}
```

This excerpt will result in `Liquid Exception: highlight tag was never closed in buggy-post.txt`, since the `{{ openTag }} highlight %}` tag is never closed.

To fix this, you can either fix every post so that the excerpt is valid Liquid markup, or prevent Jekyll from generating the excerpts in the first place.  
Jekyll does not [yet](https://github.com/mojombo/jekyll/pull/1386) have a way to disable excerpts entirely, so the next-best option is to configure it so that the excerpts are always valid Liquid.

You can do this by setting `excerpt_separator` to a nonsense string that never appears in your posts, so that the excerpt will include the entire post (which is already known to be valid markup).
Better yet, you can set `excerpt_separator` to an empty string, so that the excerpt will end immediately.  This will reduce the amount of work that Jekyll needs to do, making your site build slightly faster.

In short, this bug can be fixed by adding the following line to `_config.yml`:

```yaml
excerpt_separator: ""   # Workaround for https://blog.slaks.net{{ page.url }}
```

Once [#1386](https://github.com/mojombo/jekyll/pull/1386) is released, this line will disable excerpts entirely, adding another miniscule performance boost.