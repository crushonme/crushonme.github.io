---
layout: post
title: Windows Proxy Configuration Limitations
categories: Browsers
description: N/A
keywords: proxy,proxyoverride
---

When you’re connected to the internet and using a proxy server while browsing the web, that traffic goes through the proxy server instead of coming directly from your Windows. A proxy server can be used when you’re connected using Wi-Fi or Ethernet. In some cases, your company or organization might require a proxy server. Then we can configure it through UI or registry key. In this article we will tell you some limitations about Windows proxy settings.

# Limitation 1: The length limitation for the proxy-override during runtime are 2064 Bytes.

This also includes the appended ";\<local>" for the option "Bypass proxy server for local addresses".

## Solutions
In case the list is exceeding 2064 characters and there is no further room for optimization, you need to implement the routing through a PAC-file instead of fixed proxy-settings.

# Limitation 2: The character /* is not valid when used at the end of a proxy exception URL.

Actually /* in the end of proxy exception URL is meaningless.

## Solutions 
To resolve the issue, remove /* from the original URL.

> **Demo**
>> URLs like http://www.test.com/* or http://www.test.com/ are not considered valid proxy exception URLs.
