---
title: "Migrating RSS/Atom feeds from Blogger to Jekyll"
layout: "post"
categories: [Jekyll, RSS, Atom]
---

The next step in my migration to Jekyll was creating the RSS feed.  This involved a couple of concerns.

##URLs
An important objective during any migration is to preserve existing URLs wherever possible.  Blogger's feeds are `/feeds/posts/default` (Atom) and `/feeds/posts/default?alt=rss` (RSS).  Since Jekyll cannot vary pages by querystring, I needed to drop RSS.

##Preserving IDs

##Dates