---
layout: post
title: How To Open FTP Protocol In Explore By Default
categories: Browsers
description: On Windows, IE is default protocol handler for FTP. So how to Open FTP protocol in Explore? This document is for your reference.
keywords: knownfolder
---

For system before Windows10, we can follow document [FTP and Internet Explorer… What to do, what to do.](https://docs.microsoft.com/en-us/archive/blogs/askie/ftp-and-internet-explorer-what-to-do-what-to-do)

For Windows 10 system, please us below script. Note that key DelegateExecute under HKEY_CLASSES_ROOT\IE.FTP\shell\open\command should be null.
```
Windows Registry Editor Version 5.00
 
[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\MAIN\FeatureControl\FEATURE_INTERNET_SHELL_FOLDERS]
"iexplore.exe"=dword:00000001
 
[HKEY_CLASSES_ROOT\IE.FTP]
@="URL:File Transfer Protocol"
"AppUserModelID"="Microsoft.InternetExplorer.Default"
"EditFlags"=dword:00200002
"FriendlyTypeName"="@C:\\Windows\\System32\\ieframe.dll,-905"
"URL Protocol"=""
 
[HKEY_CLASSES_ROOT\IE.FTP\DefaultIcon]
@="C:\\Windows\\System32\\url.dll,0"
 
[HKEY_CLASSES_ROOT\IE.FTP\shell]
 
[HKEY_CLASSES_ROOT\IE.FTP\shell\open]
"CommandId"="IE.Protocol"
 
[HKEY_CLASSES_ROOT\IE.FTP\shell\open\command]
@="C:\\Windows\\explorer.exe %1"
"DelegateExecute"=""
```

Before merge the registry script, please backup your registry.