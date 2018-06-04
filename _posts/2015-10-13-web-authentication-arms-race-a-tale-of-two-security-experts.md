---
title: "The Web Authentication Arms Race – A Tale of Two Security Experts"
layout: "post"
categories: [security]
---

Web authentication systems have evolved over the past ten years to counter a growing variety of threats.  This post will present a fictional arms race between a web application developer and an attacker, showing how different threats can be countered with the latest security technologies.

This entire conversation assumes that the user has already legitimately established some form of trust anchor (eg, a password or hardware token) with the defender before the attacker came onto the scene.  Cryptography [can only be used](https://blogs.msdn.com/b/ericlippert/archive/2011/09/27/keep-it-secret-keep-it-safe.aspx) to transfer existing trust or secrecy across time or space; if the attacker impersonates the defender before the user establishes anything, it becomes impossible for the user to tell which party is legitimate.  This also assumes that the site itself has no vulnerabilities (such as XSS or CSRF) that would allow attackers to run code or read data, or read certificates from the server.

 - **Defender**: Users will enter a username & password, and I will give them an authentication cookie for me to trust in the future.
 - **Attacker**: I will watch your network traffic and steal the passwords as they come down the wire.

 - **Defender**: I will change the `<form>` to submit over HTTPS, so you won't see any readable passwords.
 - **Attacker**: I will run an active [MITM attack](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) as the user loads the login page, and insert Javascript that sends the password to my server in the background.

 - **Defender**: I will serve the login page itself over HTTPS too, so you won't be able to read or change it.
 - **Attacker**: I will watch your network traffic and steal the resulting authentication cookies, so I can still impersonate users even without knowing the password.

 - **Defender**: I will serve the entire site over HTTPS (and mark the cookie as Secure), so you won't be able to see any cookies.
 - **Attacker**: I will run an active MITM attack against your entire site and serve it over HTTP, letting me see all of your traffic (including passwords and cookies) again.

 - **Defender**: I will serve a [`Strict-Transport-Security` header](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security), telling the browser to always refuse to load my site over HTTP (assuming the user has already visited the site over a trusted connection to establish a trust anchor).
 - **Attacker**: I will find or compromise a shady certificate authority and get my own certificate for your domain name, letting me run my MITM attack and still serve HTTPS. 
 
 - **Defender**: I will serve a [`Public-Key-Pins` header](https://en.wikipedia.org/wiki/HTTP_Public_Key_Pinning), telling the browser to refuse to load my site with any certificate other than the one I specify.
  
 _At this point, there is no reasonable way for the attacker to run an MITM attack without first compromising the browser._
  
 - **Attacker**: I will make a fake login page and phish users for passwords.
  
 - **Defender**: I will add two-factor authentication, making your stolen passwords useless without the non-reusable second factor.
  
 - **Attacker**: I will change my phishing page to request a second factor as well, then immediately use it to log in once.  (this will give the attacker a single login session with no way of logging in again, but that is often enough to cause harm)
  
 - **Defender**: I will replace my SMS or [TOTP](https://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm) second factor with a private key on a [tamper-resistant hardware device](https://www.yubico.com/products/yubikey-hardware/), rendering an MITM attack completely unable to use the stolen credential (the private key is used to sign a challenge from the server, and never leaves the device).  This also prevents phishing attacks, since the browser will incorporate the site origin into the challenge signed by the private key, and will refuse to send a challenge signed for the defender's server to any other origin.  This is only possible because the browser actively cooperates, unlike purely web-based solutions like SQRL.
 
 _Private keys, such as U2F devices, are unphishable credentials; it is now completely impossible for anyone who does not have physical posession of the private key to authenticate.  Note that this assumes that the hardware device is trusted; if the attacker can swap the device for a device with a known private key, all bets are off.  Also note that you should still use a password in conjuction with the hardware device, to prevent an attacker from simply stealing the device (if the device itself requires a password to operate, that's also fine)._
 
 - **Attacker**: I will trick the user into installing a malicious browser extension or desktop application, then use it to read the authentication cookie from the browser's cookie jar.
 
 - **Defender**: I will use [channel-bound cookies](https://www.browserauth.net/channel-bound-cookies), linking my authentication cookie to the private key used to generate the SSL connection.  This way, the authentication cookie will only work in an HTTPS session backed by the same private key, preventing the attacker from using it on his computer.
 - **Attacker**: I will change my malicious code to exfiltrate the private key as well as the authentication cookie, allowing me to completely clone the SSL connection on my machine, and still use the cookie.
 
 - **Defender**: I will hope that the user's browser signs its HTTPS connections with a hardware-based private key (hardware-backed token binding), preventing the attacker from cloning the SSL session without access to that private key (which never leaves the hardware device).
 - **Attacker**: I will change my malicious code to run a reverse proxy through the user's browser, sending my arbitrary requests through the same token-bound SSL session as the user's actual requests.
 
 - **Defender**: I will encourage users to use a platform & browser that does not allow processes or extensions to interact with security contexts for other origins.  This way, the attacker's malicious code will not be able to read my cookies or send requests to my site.
  
  _Assuming no application-level vulnerabilities (such as XSS or CSRF), and no vulnerabilities in the platform itself, such a platform would be completely secure against any kind of attack.  Unfortunately, I am not aware of any such platform that also supports unphishable credentials.  Chrome OS supports unphishable credentials, but offers no way to prevent extensions from sending HTTP requests to your origin.  Most mobile browsers (on non-rooted devices) do not support extensions at all, but do not currently support unphishable credentials._
  
# Theory vs. Practice
In theory, given these assumptions, this design is completely secure.  In practice, however, the situation is rarely so simple.  There are a number of issues which make these assumptions difficult to meet, or negate security in other ways.

## Authenticating the user
This technique serves to completely prove that the user is in physical possession of a hardware token.  However, it does not help assure you that the hardware token actually belongs to the user you think it does.  If an attacker can convince you that _his_ hardware token belongs to the user, he can still perform MITM attacks, since your server has no way of knowing that he isn't actually the user.

By definition, you cannot use a hardware token to authenticate the user who is setting up a hardware token, so you're back to relying on classical HTTPS and certificate pinning, leaving you vulnerable to malicious code running on the client.  If you're associating an online account with some existing entity, such as a bank account (as opposed to creating an entirely new account, such as an email account), you'll need some way of proving that the user creating the account is actually associated with the existing entity, and not an attacker impersonating or MITMing the user.  The best way to do this is for the user to verify themselves in person and associate the token using trusted, defender-controlled hardware.
  
## Trusting hardware
It is impossible to defend against an attacker who can run arbitrary code on the user's machine (since there is no way for the defender's server to distinguish between requests sent from legitimate code on the user's behalf, vs. hostile code from the attacker).  The completely-secure scenario above postulated that the user's platform does not allow arbitrary code in the first place, neatly side-stepping this problem.

Mobile platforms attempt to make this guarantee, preventing other applications from reading the browser's cookie jar or private keys.  However, completely enforcing this is harder; any security vulnerability (or actual nefarious code) in the browser, OS, or even platform hardware may negate this guarantee.  For example, the ability to root or jailbreak an Android or iOS device (and thus bypass the protections around the browser) mean that they do not actually provide this guarantee.

An important step forward in this regard is trusted boot, as used by Windows and Chrome OS, in which the entire chain of execution from the BIOS to the boot loader to the OS to the hardware drivers is signed and verified on each boot.  However, security vulnerabilities in the signed code can still lead the arbitrary code execution and compromise the machine.

More troublingly (assuming nation-state level attackers), even if the user does have completely-secure hardware, the attacker can replace it with attacker-controlled hardware that contains a reverse proxy and bypasses all of these protections.  There is no simple way for the user to authenticate their own hardware device (other than keeping it in sight at _all_ times); the attacker can open up the existing device and copy all data and private keys to the backdoored device to ensure that it looks and behaves identically.

(You could build a tamper-proof hardware-backed private key that will self-destruct if removed from the PCB, but you'll need to hope that your tamper-proofing is better than the attacker's tampering.  And that the attacker can't modify other parts of the hardware to insert a backdoor without removing anything.)

## Forgot password
Finally, the Forgot Password feature is the complete antithesis of these security guarantees.  The entire point of Forgot Password is to authenticate the user _without_ any of these trusted credentials.  Thus, this reintroduces the problem of initially associating the user, as mentioned in the first issue.  In this situation, unlike account creation, you always need to prove who the user is, since you're associating the user with an existing account, rather than simply creating a new account from scratch.

Forgot Password features are typically implementing by delegating authentication to some other (implicitly-trusted) service; usually email.  When first creating the account, the user specifies an email address, and the user can then authenticate by proving that he can read an email sent to that address (usually alongside a low-grade second factor such as a security question).  However, this opens up additional risks; any attacker that can compromise the user's email account (and the second factor, which is usually easy) can compromise the account at any time.  In addition, if the user legitimately uses the Forgot Password, there is no way to prevent malicious code already running on the client from MITMing that connection and compromising the account (eg, by adding the attacker's private key alongside the user's). 
