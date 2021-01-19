---
layout: post
title: How to use APPCMD change configurations for site which name contains blank
categories: IIS
description: N/A
keywords: appcmd,IIS
---

When we want to change configurations for site, we usualy use appcmd.exe to handle it. However when website name contains blank, it will throw an error like below.

```bat
C:\>%windir%\system32\inetsrv\appcmd.exe set config -section:system.applicationHost/sites /[name='Default Web Site'].logFile.logExtFileFlags:Date,Time,ClientIP,UserName,ServerIP,Method,UriStem,UriQuery,TimeTaken,HttpStatus,Win32Status,ServerPort,UserAgent,HttpSubStatus,Referer,BytesRecv,BytesSent

Failed to process input: The parameter 'Site'].logFile.logExtFileFlags:Date,Time,ClientIP,UserName,ServerIP,Method,UriStem,UriQuery,TimeTaken,HttpStatus,Win32Status,ServerPort,UserAgent,HttpSubStatus,Referer,BytesRecv,BytesSent' must begin with a / or - (HRESULT=80070057).
```

So how to handle it?

We should use '%20' replace blank in name. For example, use 'Exchange%20Back%20End' instead of 'Exchange Back End'.

```bat
%windir%\system32\inetsrv\appcmd.exe set config -section:system.applicationHost/sites /[name='Exchange%20Back%20End'].logFile.logExtFileFlags:Date,Time,ClientIP,UserName,ServerIP,Method,UriStem,UriQuery,TimeTaken,HttpStatus,Win32Status,ServerPort,UserAgent,HttpSubStatus,Referer,BytesRecv,BytesSent
```
