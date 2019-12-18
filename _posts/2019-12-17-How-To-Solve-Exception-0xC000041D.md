---
layout: post
title: How to Solve Exception 0xC000041D
categories: Windbg
description: How to handle exception 0xC000041D, which means An unhandled exception was encountered during a user callback.
keywords: 0xC000041D, ProcDump
---

Exception 0xC000041D means that an unhandled exception was encountered during a user callback. It means that 0xC000041D is a second chance exception. So we should capture the first chance exception ,if we want to know the root cause.  Usually it's occurred in system defined callback context on Windows, for example message handling context. And customized callback will not throw the exception.



# How to Capture the original exception?

We can use [procdump](https://docs.microsoft.com/en-us/sysinternals/downloads/procdump) to capture the original first chance exception with below command:

```
procdump -e 1 -f "" processname
```



For example: In below picture, we can see the first chance exception is 0xC00000FD, Stack Overflow.

![0xC000041D](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/0xC000041D.png)







