---
layout: post
title: Why I faied to download files from website with error INET_E_DATA_NOT_AVAILABLE
categories: Browser
description: 
keywords: INET_E_DATA_NOT_AVAILABLE,0x800C0007
---

After migrate website from http to https, IE perhaps failed to download files and return “Can’t reach this page” on Windows 10. 
![INET_E_DATA_NOT_AVAILABLE](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/IE_INET_E_DATA_NOT_AVALIABLE.png)


 Below are several test for the issue:
- The issue is not reproduced with fiddler;
- The issue is not reproduced with http protocol;
- The issue is not reproduced on Windows 7;
- The URL in property tab will be res://ieframe.dll/dnserror.htm?ErrorStatus=0x800C0007#https://reprohyperlink.com
- Check whether is it the same scenario of miss using of  response.close described in [Content-Length and Transfer-Encoding Validation in the IE10 Download Manager](https://docs.microsoft.com/en-us/archive/blogs/ieinternals/content-length-and-transfer-encoding-validation-in-the-ie10-download-manager) and [Response.End, Response.Close, and How Customer Feedback Helps Us Improve MSDN Documentation](https://docs.microsoft.com/en-us/archive/blogs/aspnetue/response-end-response-close-and-how-customer-feedback-helps-us-improve-msdn-documentation )

Considering all above situation, we thought it might be related with HTTP2 which added on Windows 10. [Fiddler currently does not support HTTP2](https://feedback.telerik.com/fiddler/1361558-http-2-support). HTTP2 on windows does not support H2c (HTTP2 over TCP). Actually most of browsers does not support H2c. 

So We tried to disable HTTP2 on IE and the issue is gone.

The issue is caused by content-length validation in HTTP2 protocol. In [HTTP2 RFC](https://http2.github.io/http2-spec/#malformed), it described the issue:
>A request or response that includes a payload body can include a content-length header field. A request or response is also malformed if the value of a content-length header field does not equal the sum of the DATA frame payload lengths that form the body. 

Finnaly, we got the root cause. In the application, it add Content-Lenght header in code. Acturally, the real content length is bigger than the size of download file. We do not suggest to add Content-Length header in application as ASP.NET will set content-length for you if you don’t specify it in HTTP 1.1. And for HTTP2 , Content-Length header field is optional. 
![FAILED_TO_DOWNLOAD_FILES](https://crushonme-1256821258.cos.ap-shanghai.myqcloud.com/FAILED_TO_DOWNLOAD_FILES.png)

BTW, Response.End is provided only for compatibility with ASP. It should not be used in ASP.NET, more information descripbed in [Response.End, Response.Close, and How Customer Feedback Helps Us Improve MSDN Documentation](https://docs.microsoft.com/en-us/archive/blogs/aspnetue/response-end-response-close-and-how-customer-feedback-helps-us-improve-msdn-documentation).