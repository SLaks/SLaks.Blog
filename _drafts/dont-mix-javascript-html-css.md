---
title: "Don't mix Javascript with HTML or CSS"
layout: "post"
categories: [Javascript, HTML, CSS]
---

Using CSS directly via DOM is poor practice, for the same reason that putting CSS properties in HTML is poor practice; Javascript code should not need to know about things like color schemes or font sizes.  Keeping all CSS within CSS (or LESS, etc) files makes for much more maintainable sites.  
Instead, JS code should set classes to trigger CSS rules defined in stylesheets
In practice, this is frequently unavoidable, especially when doing animations or interactive effects.  When it is unavoidable, it's best to keep the coupling to a minimum; for example, you can read the values from CSS (directly or indirectly) rather than hard-coding them in JS.
Similarly, JS code ideally should not manipulate HTML directly; script code should not contain actual content.  Instead, use client templating engines or binding systems to write HTML that is declaratively bound to a view-model maintained by JS.  Look at libraries like Knockout.js or Handlebars.js; for a fuller (but somewhat old) list, see http://www.hanselman.com/blog/TheBigGlossaryOfOpenSourceJavaScriptAndWebFrameworksWithCoolNames.aspx
