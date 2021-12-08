---
layout: post
title: Faild To Access Edge Experiments Page
categories: Browsers
description: 
keywords: experiments,edge,chrome,STATUS_BREAKPOINT,flags
---

We will fail to access edge://flags page after disable "latest stable javascript features". It's likely due to those pages using latest JavaScript features, which are shipped by default.

After researching and troubleshotting, we found that all these flags are defined in Local state file located in userdata folder in profile folder. So I tried to rename the Local State and then access edge://flags in Edge. However it does not work.

I tried to reprodcue the issue in Chrome and found that Chrome has same issue. After researching, I found a parameter switch (--no-experiments) to run Chrome with default flags. Then I tried to access Chrome://flags page with --no-experiments and it works.

Then I tried to apply the same solution with Edge. However it does not work stable. Sometime we can access edge://flags page and sometime not. I noticed that the msedge.exe exist in Task Manager after I closed Edge in not working scenario. So I tried to access edge://flags with --no-experiments after confirming all msedge.exe terminated. It works now.

Here is the ***Solutions*** for access edge://flags without STATUS_BREAKPOINT error.
```bat
taskkill /IM msedge.exe /F
start edge.exe  --no-experiments 
@rem Then acccess edge://flags and enable "latest stable JavaScript features"
```