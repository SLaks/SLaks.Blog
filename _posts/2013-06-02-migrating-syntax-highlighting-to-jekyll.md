---
title: "Migrating client-side syntax highlighting to Jekyll"
layout: "post"
categories: [Jekyll, C#]
---

The next step in [migrating my blog to Jekyll]({% post_url 2013-05-31-migrating-from-blogger-to-jekyll %}) was to convert the code blocks to use Jekyll's <code>&#123;% highlight %}</code> tag.  

Since Blogger has no support for server-side syntax highlighting, all of the code blocks in my HTML are implemented as `<pre class="brush: someLanguage">...</pre>`, with HTML-escaped code inside the tag.  (the class name is used by [SyntaxHighlighter](https://alexgorbatchev.com/SyntaxHighlighter/))  I needed to convert that to Liquid tags with raw (non-escaped) code inside of them.

To do this, I wrote a small C# script:

{% assign openTag = '{%' %}{% comment %}
The only way to embed the endraw tag (which cannot be put with braces in a comment) as text in a raw block is to brak it up in the middle.

Due to a weird bug, an endraw tag preceded by a { causes the raw and endraw tags to be emitted into the output.  It is impossible to put the { literal outside the rawness without adding an extra character before the %, so I use a variable to hold it.
{% endcomment %}
```csharp{% raw %}
const string PostsFolder = @".../_posts";
var langMappings = new Dictionary<string, string>{
	{ "vb", "vb.net" }
};
Func<string, string> GetLanguage = lang => {
	string mapped;
	if (langMappings.TryGetValue(lang, out mapped))
		return mapped;
	return lang;
};

Func<string, MatchEvaluator> Replace = replacement => ManifestResourceInfo => ManifestResourceInfo.Result(replacement);

var regexes = new [] {
	Tuple.Create<Regex, MatchEvaluator>(
		new Regex(@"\s*\<pre\s*class=""brush:\s*(\w+);?\s*"">\n*(.*?)\n*</pre>\s*", RegexOptions.Singleline),
		m => "\n{% endraw %}{{ openTag }}{% raw %} endraw %}\n{% highlight " + GetLanguage(m.Groups[1].Value) +" %}\n" 
			+ WebUtility.HtmlDecode(m.Groups[2].Value) 
			+ "\n{% endhighlight %}\n{% raw %}\n"
	),
	Tuple.Create(new Regex(@"{% raw %}\s*{% endraw %}{{ openTag }}{% raw %} endraw %}\s*", RegexOptions.Singleline), Replace("")),
	Tuple.Create(new Regex(@"<font face=""Courier New"">([^<]+)</font>", RegexOptions.Singleline), Replace("<code>$1</code>"))
};

foreach (var file in Directory.EnumerateFiles(PostsFolder, "*.html")) {
	File.WriteAllText(file,
		regexes.Aggregate (File.ReadAllText(file), (txt, tuple) => tuple.Item1.Replace(txt, tuple.Item2))
	);
}
{% endraw %}```

(This kind of script is most easily run in [LINQPad](https://linqpad.net) or [scriptcs](https://scriptcs.net/))

This code loops through every HTML file in `PostsFolder` and runs the text through a series of regular expressions (yes, evil) to update it for Jekyll.

The first, and biggest, regex matches `<pre class="brush: someLanguage">...</pre>`, and convers each to Jekyll `{{ openTag }} highlight someLanguage %}` blocks.  Since SyntaxHighlighter uses different language names than [Pygments'](https://pygments.org/docs/lexers/#lexers-for-net-languages), I have a `langMappings` that maps language names from the HTML to language names for the Jekyll output.  I also un-HTML-escape the contents of each code block.  Finally, because I modified blogger2jekyll to wrap each post in a `{{ openTag }} raw %}` tag, it terminates the `{{ openTag }} raw %}` and re-enters it after the code.  

Depending on what your code blocks look like, you may want to change it to wrap the contents of each `{{ openTag }} highligh %}` tag in a `{{ openTag }} raw %}` block too.  

The next regex strips empty `{{ openTag }} raw %}` blocks in case there are two code blocks in a row (which I had [here]({% post_url 2011-09-14-clarifying-boolean-parameters-part-2 %})).

The last regex replaces bad non-semantic `<font>` tags created by Windows Live Writer with `<code>` tags.  
If your imported HTML has similar issues, you can add more regexes to correct them.

_Next time: Preserving the RSS feed_