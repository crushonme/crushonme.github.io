---
layout: post
title: AWS 中使用 ALB/ELB 导致使用 Windows Authentication 的 ASP.NET 程序中获取到错误的 Identity 信息
categories: Windows,ASP.NET
description: 本文介绍如何规避 AWS 中使用 ALB/ELB 时遇到的 Windows Authentication 问题。
keywords: Windows Authentication,NTLM,Kerberos
---

# 问题场景

当我们在 AWS 中部署使用 Windows Authentication 的 ASP.NET 应用时，如果前端使用了 AWS 的 ALB 或者 ELB 时会发现获取到的 Identity 信息偶发性出错；



# 必备知识点

1. 在 IIS （6.0版本以上） 中默认情况下 NTLM 是 Session Based Authentication， 而 Kerberos 则是 Request Based Authentication。即对于 NTLM Authentication ，同一个 TCP 会话中的请求仅做一次 NTLM Authentication， IIS 会在 Server 端缓存 Token 或者 Ticket；对于 Kerberos Authentication ， 则每个请求均需要认证；参考 [Are you seeing 401’s too often for HTTP web requests?](https://blogs.msdn.microsoft.com/saurabh_singh/2010/01/06/are-you-seeing-401s-too-often-for-http-web-requests/)
2. IIS 中 Windows Authentication 的行为可以通过 authPersistNonNTLM 和 authPersistSingleRequest 来改变，即 如果希望将 NTLM 改为 Request Based Authentication ， 则需要将 authPersistSingleRequest 改为 true ； 如果希望将 Kerberos Authentication 改为 Session Based Authentication ， 则需要将 authPersistNonNTLM 改为 true ；参考 [Windows Authentication ](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/security/authentication/windowsauthentication/)
3. 在使用 NLB 的场景下， 部分 NLB  为了提升性能，会重用 TCP 会话；



# 排查思路

当前场景中由于存在 NLB，此时遇到 Windows Authentication 出错问题时，我们通常需要客户端和服务端同时抓取抓取网络包排查，确认 NLB 端是否有重用 TCP 会话；同时在 IIS 端开启 [Failed Request Tracing](https://docs.microsoft.com/en-us/iis/configuration/system.applicationhost/sites/site/tracefailedrequestslogging) :

- 如果重用了 TCP 会话，那么 IIS 端则会认为是同一个认证用户；
- 如果未重用 TCP 会话，则分析 FREB 中获取到的 Identity 信息，然后根据应用代码确认出问题的 Identity 是在何处被修改；

在 AWS 中的 Web ，一般情况下会开启 ALB 或者 ELB ，这两者都是应用层的负载均衡，其基于 HTTP keep alive 机制，为了提升性能，都会重用 TCP 会话。因此对于这种场景下，我们可以通过以下两种方法之一来规避问题：

- 调整 IIS 设置，即修改 authPersistNonNTLM  或者 authPersistSingleRequest 设置；
- 在前端的 NLB 测，关闭 TCP 重用功能；

