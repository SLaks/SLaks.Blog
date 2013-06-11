---
title: "Writing the endraw tag in Jekyll code blocks"
layout: "post"
categories: [Jekyll, Liquid, jekyll-hacks]
---

{% assign openTag = '{%' %}

[Last time]({% post_url 2013-06-09-writing-about-jekyll-in-jekyll %}), we saw how to write about Jekyll tags in Jekyll-based blog posts, using HTML entities or the `{{ openTag }} raw %}` block.  

These techniques cannot be used in syntax-highlighted code blocks (Jekyll's <code>&#123;% higlight %}</code> tag or a Markdown code block), since such blocks are always HTML-escaped.  Instead, you can wrap all of the code in the block with a Liquid <code>&#123;% raw %}</code> tag.  Since the Liquid tag is processed before Markdown or syntax highlighting, this works perfectly.

<div class="jekyll"></div>
``` {% raw %}
{% raw %}
Liquid uses tags like {% if %} or {% for %}.
It also supports variable interpolation: {{ someVariable }}
{% endraw %}{{ openTag }} endraw %}
```

This approach works wonderfully, until you try to put the <code>&#123;% endraw %}</code> tag in a code block.  You can't put that in a <code>&#123;% raw %}</code> block, because it will close the block.  You can't use entities, because text within highlighted code blocks is always HTML-escaped.  

One potential option would be to break apart the tag; something like

<div class="jekyll"></div>
``` {% raw %}
{% raw %}
This is how you show the termination of the `{% raw %}` tag inside itself: 
{% {% endraw %}endraw %}{% raw %}
{% endraw %}
```

However, due to [a bug in Liquid](https://github.com/Shopify/liquid/issues/204), this doesn't work correctly.  This markup is supposed to mean the following:

 1. Write the literal text `{{ openTag }}` within the <code>&#123;% raw %}</code> block
 1. Terminate the <code>&#123;% raw %}</code> block with <code>&#123;% endraw %}</code>
 1. Write the rest of the of the tag (`endraw %}`)
 1. Re-enter the  <code>&#123;% raw %}</code> block to continue with other markup

What actually happens is that Liquid ignores the actual <code>&#123;% endraw %}</code> command, and treats the entire line as raw text.  In other words, the code you see in the above example is (incorrectly) rendered exactly as written.  The literal text `{{ openTag }}` before the `{{ openTag }} endraw %}` causes Liquid to ignore the tag completely, breaking this technique.

To work around this bug, we need to put the `{{ openTag }}` text outside the `{{ openTag }} raw %}` block.  However, Liquid does not have any way to escape a `{`, and we can't use HTML escaping inside the highlighted code block, so there is no obvious way to write the `{{ openTag }}`  without breaking the parser.

Variables can help here.  We can create a Liquid variable that holds the literal text `{{ openTag }}`, then interpolate this variable outside the `{{ openTag }} raw %}` block.
For example:

<div class="jekyll"></div>
``` {% raw %}
{% assign openTag = '{%' %}
{% raw %}
This is how you show the termination of the `{% raw %}` tag inside itself: 
{% endraw %}{{ openTag }} endraw %}{% raw %}{{ openTag }} endraw %}{% raw %}
This content is back inside the {% raw %} block
{% endraw %}{{ openTag }} endraw %}
```

This code is parsed like this:
 
 1. Terminate the `{{ openTag }} raw %}` block with `{{ openTag }} endraw %}`
 2. Write the value of the `openTag` variable (`{{ openTag }}`) with `{% raw %}{{ openTag }}{% endraw %}`
 3. Write the remainder of the `{{ openTag }} endraw %}` tag as literal text with <code>&nbsp;endraw %}</code>
 4. Re-enter the `{{ openTag }} raw %}` block for additional raw content

This technique can also be used to write tags in inline code: <code>&#96;{% raw %}{{ openTag }} sometag %}{% endraw  %}&#96;</code>

If these worksarounds seem completicated, writing this post itself (also in Liquid Markdown!) was even more complicated.  
See the [source]({{ site.githubRawUrl }}{{ page.path }}) to see how I did it.