---
layout: post
title: Why It Show Unknown Zone Even though Adding Websites To Trust Site
categories: Browsers
description: This article talk about one possible reason about Unknown Zone(mixed).
keywords: IE11, Security Zone, Unknown Zone(mixed)
---

If we found that properties tab show Unknown Zone(mixed), it means that some resources your website referenced belongs to other security zone. We can quickly figure out it use fiddler or F12 debugging tools. If we didn't find any resource cross domain, we should consider whether it refer resource in ieframe.dll.

Considering below scenario:

- Enabled "Show Friendly HTTP error message" in Internet option advanced tab;
- The website return [400, 403, 404, 405, 406, 408, 409, 410, 500, 501, 505]  status code and response body's byte length shorter than a threshold value; [Click here to get more knowledge about Friendly HTTP Error Page]( https://blogs.msdn.microsoft.com/ieinternals/2010/08/18/friendly-http-error-pages/ )

If we try to add the website to one of security zone except internet zone, we will get Unknown Zone(mixed).



**WHY?**

IE will use resource in res://ieframe.dll instead of a terse server message in above scenario. By default resource in res://ieframe.dll is treated as internet resource except we disable [Local Machine Zone Lockdown]( https://blogs.msdn.microsoft.com/ieinternals/2011/03/23/understanding-local-machine-zone-lockdown/ ).

> When LMZL is off, content retrieved using the RES:// protocol is no longer mapped to the Internet Zone and will instead be mapped to the Local Machine zone; this can result in functionality bugs because the content is running in an unexpected zone. There are a handful of these very subtle behaviors and folks have wasted quite a bit of time discovering that some “major issue” was in-fact caused by having a non-default setting here.

So in above scenario, IE will return "Unknown Zone(mixed)" in properties.



**How To Solve it?**

The first solution inside our head may be adding res://ieframe.dll to trust site. However if we add res://ieframe.dll in IE settings, you will find that **about:internet** is added instead of res://ieframe.dll. Adding about:internet to trust site is a dangerous  and not recommended.

If we add res:// protocol use site assignment list, it will not take effects. It's by design.

So we only have two options to remove the issue:

- Fix it at client side which means disable "Show Friendly HTTP error message" Or integrate the threshold value;
- Fix it at server side which means return response bigger than 512 bytes;