---
layout: post
title: Third Party CredSSP Supportability For Legacy Edge
categories: Browser
description: 浏览器相关调试和排障技巧汇总
keywords: Legacy Edge, CredSSP
---

Legacy Edge does not support for third party CredSSP as EdgeHTML blocked third party libraries.

This is because of that third party DLLs are blocked by code integrity rule of legacy edge. For more information we can refer to [Microsoft Edge Module Code Integrity](https://blogs.windows.com/msedgedev/2015/11/17/microsoft-edge-module-code-integrity/)

> **Starting with EdgeHTML 13, Microsoft Edge defends the user’s browsing experience by blocking injection of DLLs into the browser unless they are Windows components or signed device drivers.** DLLs that are either Microsoft-signed, or WHQL-signed, will be allowed to load, and all others will be blocked. “Microsoft-signed” allows for Edge components, Windows components, and other Microsoft-supplied features to be loaded. WHQL (Windows Hardware Quality Lab) signed DLLs are device drivers for things like the webcam, some of which need to run in-process in Edge to work. For ordinary use, users should not notice any difference in Microsoft Edge.
