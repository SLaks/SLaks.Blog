---
title: "The Perils of Uppercase in Gmail's Send As"
layout: "post"
categories: [gmail, bug]
---

One of Gmail's many useful features is "Send mail as", which lets you use a single Gmail account to send emails from multiple email addresses.  Especially when combined with email forwarding, this is a great way to manage multiple email accounts from a single Gmail tab.

By default, this feature will send the email from Gmail's regular SMTP servers, including your actual email address in the `Sender` header to indicate the original sender of the email (without that, the email would be rejected as spam, since it isn't coming from the correct SMTP servers for that domain).  To avoid this, you can select `Send through my SMTP servers` to tell Gmail to connect to your domain name's actual SMTP servers and send the email directly through them.  This approach makes the email indistinguishable from regular emails sent from that domain name.  To make it work, you need to enter the SMTP server, username, and password for Gmail to connect with.

However, when using this feature to send through a Google Apps domain with [DKIM](http://en.wikipedia.org/wiki/DomainKeys_Identified_Mail) enabled, I noticed that every email I sent through Send as got an invalid DKIM signature, causing some email providers to reject it as spam (you can check this using [port25's verifier](http://www.port25.com/support/authentication-center/email-verification/)).  Sending email directly over a regular SMTP client worked, but sending through Gmail's Send As would break the DKIM signature.

After corresponding with Gmail support, I discovered that this happens if you use uppercase characters in the email address to send from.  If you enter the address with only lowercase characters, it works fine; if you include uppercase characters, the signature breaks.
If you're having this problem, you need to delete the Send As entry, then re-create in all-lowercase.