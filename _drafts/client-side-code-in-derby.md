---
title: "Running client-side code in Derby.js"
layout: "post"
categories: [Derby.js, Javascript, browserify]
---

Derby automatically runs browserify on the app file (`app/index.js`) to run it on the client.

Therefore, you can `require()` all of your client code (including things like jQuery) from there and it will show up on the client.

To prevent this code from running on the server, wrap it in an `app.ready(function(model) { ... })` callback.  
Derby will only run this callback on the client, so `require()`s from there won't execute on the server.