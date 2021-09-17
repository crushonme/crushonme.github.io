---
layout: post
title: Why Edge/Chrome Add %20--disable-features=RendererCodeIntegrity as suffix in the URL
categories: Browsers
description: 
keywords: Edge,Chrome,RendererCodeIntegrity,disable-features
---

If you have IP-Guard software installed and set Microsoft Edge as default browser, you might are suffuring the issue of that Edge add “%20--disable-features=RendererCodeIntegrity” as suffix in the URL when you double click the local pdf file or try to access hyperlink in outlook. Just like the issue mentioned in [How can I disable "%20--disable-features=RendererCodeIntegrity" from being automatically appended to the URL in Microsoft Edge(chromium)?](https://superuser.com/questions/1614855/how-can-i-disable-20-disable-features-renderercodeintegrity-from-being-autom)

# Solution
This is because C:\WINDOWS\SYSTEM32\DtFrame64.dll,one of component in IP-Guard software, hooked explorer.exe.

# Analysis
We will see below trace in Process Monitor logs:

| Date & Time           | Process Name | PID   | Detail                                                                                                                                                                                      | TID  | Operation      | Path                                                         | Result  |
|-----------------------|--------------|-------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|----------------|--------------------------------------------------------------|---------|
| 9/16/2021 10:08:37 AM | Explorer.EXE | 8840  | PID: 17340, Command line: "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --single-argument C:\Users\test\Downloads\test.pdf --disable-features=RendererCodeIntegrity        | 3156 | Process Create | C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe | SUCCESS |
| 9/16/2021 10:08:37 AM | msedge.exe   | 17340 | Parent PID: 8840, Command line: "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --single-argument C:\Users\teset\Downloads\test.pdf --disable-features=RendererCodeIntegrity | 3156 | Process Start  |                                                              | SUCCESS |

In the callstack of Process Create Event, we will see the module hooked.
![dtframe64](/../images/posts/dtframe64.png)