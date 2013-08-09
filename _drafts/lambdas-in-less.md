---
title: "Using Lambda Expressions in LESS"
layout: "post"
categories: [LESS]
---

[LESS](http://lesscss.org) is a language which compiles to CSS and adds useful features like variable and mixins.  These features can be used to simulate more advanced features that LESS does not explicitly support.  

LESS mixins can be passed as &ldquo;parameters&rdquo; to other mixins, allowing you to write mixins that accept lambda expressions to provide additional behavior.

For

<div class="LESS"></div>
```css {% raw %}
.InfoBox() {
	h1 {
		.ApplyColors(#fcc, navy);
		margin-bottom: 0;
	}
	article {
		.ApplyColors(#eee, #333);
	}
}

.LightPage section {
	.InfoBox();
	.ApplyColors(@light, @dark) {
		color: @dark;
		background: @light;
	}
}
.DarkPage section {
	.InfoBox();
	.ApplyColors(@light, @dark) {
		color: @light;
		background: @dark;
	}
}
{% endraw %}```